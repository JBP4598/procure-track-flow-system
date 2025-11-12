import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportPPMPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface ParsedItem {
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  budget_category: string;
  schedule_quarter?: string;
  procurement_method?: string;
}

export const ImportPPMPDialog: React.FC<ImportPPMPDialogProps> = ({
  open,
  onOpenChange,
  onImportSuccess
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [fundType, setFundType] = useState<'general_fund' | 'trust_fund'>('general_fund');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [fileName, setFileName] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Parse and map Excel columns to PPMP fields
      const items: ParsedItem[] = jsonData.map((row: any) => {
        // Handle different possible column names from Excel files
        const itemName = row['Item Specifications'] || row['Item Name'] || row['Description'] || '';
        const qty = parseInt(row['Qty'] || row['Quantity'] || '0');
        const unitCost = parseFloat(row['Unit Cost'] || row['Cost'] || '0');
        const totalCost = parseFloat(row['Estimated Budget'] || row['Total Cost'] || row['Amount'] || (qty * unitCost));
        const unit = row['Unit of Measure'] || row['Unit'] || 'pcs';
        const budgetCategory = row['Budget Category'] || 'MOOE';

        return {
          item_name: itemName,
          description: row['Detailed Description'] || row['Description'] || itemName,
          quantity: qty,
          unit: unit,
          unit_cost: unitCost,
          total_cost: totalCost,
          budget_category: budgetCategory,
          schedule_quarter: row['Schedule/Quarter'] || row['Quarter'] || null,
          procurement_method: row['Mode of Procurement'] || row['Procurement Method'] || null,
        };
      }).filter(item => item.item_name && item.quantity > 0);

      setParsedItems(items);
      
      // Set default file name from uploaded file
      setFileName(selectedFile.name.replace('.xlsx', '').replace('.xls', ''));
      
      toast.success(`Parsed ${items.length} items from Excel file`);
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setError('Failed to parse Excel file. Please check the file format.');
      toast.error('Failed to parse Excel file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!user || parsedItems.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Get user's department
      const { data: profile } = await supabase
        .from('profiles')
        .select('department_id')
        .eq('id', user.id)
        .single();

      if (!profile?.department_id) {
        throw new Error('User department not found');
      }

      // Calculate total budget
      const totalBudget = parsedItems.reduce((sum, item) => sum + item.total_cost, 0);

      // Create PPMP file record
      const { data: ppmpFile, error: fileError } = await supabase
        .from('ppmp_files')
        .insert({
          department_id: profile.department_id,
          fiscal_year: fiscalYear,
          total_budget: totalBudget,
          uploaded_by: user.id,
          file_name: fileName || `Imported PPMP ${fiscalYear}`,
          status: 'draft',
          fund_type: fundType,
          version: 1,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // Insert all items
      const itemsToInsert = parsedItems.map(item => ({
        ppmp_file_id: ppmpFile.id,
        item_name: item.item_name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
        budget_category: item.budget_category,
        schedule_quarter: item.schedule_quarter,
        procurement_method: item.procurement_method,
        remaining_quantity: item.quantity,
        remaining_budget: item.total_cost,
      }));

      const { error: itemsError } = await supabase
        .from('ppmp_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(`Successfully imported ${parsedItems.length} items`);
      onImportSuccess();
      onOpenChange(false);
      
      // Reset form
      setFile(null);
      setParsedItems([]);
      setFileName('');
    } catch (err) {
      console.error('Error importing PPMP:', err);
      setError('Failed to import PPMP. Please try again.');
      toast.error('Failed to import PPMP');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import PPMP from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) containing your PPMP items. The system will automatically map columns to the required fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Fund Type</Label>
                <Select value={fundType} onValueChange={(value: any) => setFundType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_fund">General Fund</SelectItem>
                    <SelectItem value="trust_fund">Trust Fund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fiscal Year</Label>
                <Input
                  type="number"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                  min={2020}
                  max={2050}
                />
              </div>

              <div>
                <Label>PPMP Name</Label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., General Fund 2025"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excel-file">Excel File</Label>
              <div className="mt-2">
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Excel file should contain columns: Item Specifications, Qty, Unit Cost, Estimated Budget, Unit of Measure, Budget Category
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          {parsedItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Preview ({parsedItems.length} items)
                </h3>
                <div className="text-sm text-muted-foreground">
                  Total Budget: ₱{parsedItems.reduce((sum, item) => sum + item.total_cost, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedItems.slice(0, 10).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>₱{item.unit_cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>₱{item.total_cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{item.budget_category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedItems.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Showing first 10 items. All {parsedItems.length} items will be imported.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isProcessing || parsedItems.length === 0}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {parsedItems.length} Items
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InspectionReport {
  id: string;
  iar_number: string;
  inspection_date: string;
  overall_result: 'accepted' | 'rejected' | 'requires_reinspection';
  remarks: string | null;
  is_emergency_purchase?: boolean;
  emergency_supplier_name?: string;
  emergency_amount?: number;
  emergency_reference?: string;
  po_id?: string | null;
}

interface EditIARDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  iar: InspectionReport | null;
  onIARUpdated: () => void;
}

export const EditIARDialog: React.FC<EditIARDialogProps> = ({
  open,
  onOpenChange,
  iar,
  onIARUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    iar_number: '',
    inspection_date: '',
    overall_result: 'accepted' as 'accepted' | 'rejected' | 'requires_reinspection',
    remarks: '',
    emergency_supplier_name: '',
    emergency_amount: '',
    emergency_reference: '',
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (iar) {
      setFormData({
        iar_number: iar.iar_number,
        inspection_date: iar.inspection_date,
        overall_result: iar.overall_result,
        remarks: iar.remarks || '',
        emergency_supplier_name: iar.emergency_supplier_name || '',
        emergency_amount: iar.emergency_amount?.toString() || '',
        emergency_reference: iar.emergency_reference || '',
      });
    }
  }, [iar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iar) return;

    setLoading(true);
    try {
      const updateData: any = {
        iar_number: formData.iar_number,
        inspection_date: formData.inspection_date,
        overall_result: formData.overall_result,
        remarks: formData.remarks || null,
      };

      // Update emergency purchase fields if applicable
      if (iar.is_emergency_purchase) {
        updateData.emergency_supplier_name = formData.emergency_supplier_name;
        updateData.emergency_amount = parseFloat(formData.emergency_amount);
        updateData.emergency_reference = formData.emergency_reference;
      }

      const { error } = await supabase
        .from('inspection_reports')
        .update(updateData)
        .eq('id', iar.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inspection report updated successfully.",
      });

      onOpenChange(false);
      onIARUpdated();
    } catch (error) {
      console.error('Error updating IAR:', error);
      toast({
        title: "Error",
        description: "Failed to update inspection report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!iar) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inspection & Acceptance Report</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iar_number">IAR Number</Label>
              <Input
                id="iar_number"
                value={formData.iar_number}
                onChange={(e) => setFormData(prev => ({ ...prev, iar_number: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspection_date">Inspection Date</Label>
              <Input
                id="inspection_date"
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData(prev => ({ ...prev, inspection_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="overall_result">Overall Result</Label>
            <Select 
              value={formData.overall_result} 
              onValueChange={(value: 'accepted' | 'rejected' | 'requires_reinspection') => 
                setFormData(prev => ({ ...prev, overall_result: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accepted">
                  <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>
                </SelectItem>
                <SelectItem value="rejected">
                  <Badge variant="destructive">Rejected</Badge>
                </SelectItem>
                <SelectItem value="requires_reinspection">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Requires Reinspection</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {iar.is_emergency_purchase && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Emergency Purchase Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_supplier_name">Supplier Name</Label>
                  <Input
                    id="emergency_supplier_name"
                    value={formData.emergency_supplier_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_supplier_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_amount">Purchase Amount (₱)</Label>
                  <Input
                    id="emergency_amount"
                    type="number"
                    step="0.01"
                    value={formData.emergency_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergency_reference">Reference Number</Label>
                  <Input
                    id="emergency_reference"
                    value={formData.emergency_reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_reference: e.target.value }))}
                    placeholder="e.g., Invoice number, receipt number, etc."
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Enter any additional remarks about the inspection..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update IAR'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
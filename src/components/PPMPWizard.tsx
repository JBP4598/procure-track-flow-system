import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DateInput } from '@/components/ui/date-input';
import { Plus, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PPMPItemForm } from '@/components/PPMPItemForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PPMPFile {
  id: string;
  file_name: string;
  fiscal_year: number;
  total_budget: number;
  status: string;
  created_at: string;
  version: number;
  ppmp_number?: string;
  status_type?: string;
  end_user_unit?: string;
  prepared_date?: string;
  submitted_date?: string;
}

interface PPMPWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  editingPPMP?: PPMPFile | null;
}

interface PPMPFormData {
  file_name: string;
  fiscal_year: number;
  status_type: 'INDICATIVE' | 'FINAL';
  end_user_unit: string;
  prepared_date: Date | null;
  submitted_date: Date | null;
  agency_letterhead_url: string;
  total_budget: number;
}

interface PPMPItem {
  id?: string;
  item_name: string;
  description: string;
  project_objective: string;
  project_type: 'Infrastructure' | 'Consulting Services' | 'Goods' | 'Other';
  project_size: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  budget_category: string;
  recommended_procurement_mode: string;
  pre_procurement_conference: boolean;
  procurement_start_date: Date | null;
  procurement_end_date: Date | null;
  expected_delivery_period: string;
  source_of_funds: string;
  schedule_quarter: string;
  supporting_documents: string[];
  remarks_additional: string;
}

export const PPMPWizard: React.FC<PPMPWizardProps> = ({ onComplete, onCancel, editingPPMP }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<PPMPFormData>({
    file_name: '',
    fiscal_year: new Date().getFullYear() + 1,
    status_type: 'INDICATIVE',
    end_user_unit: '',
    prepared_date: new Date(),
    submitted_date: null,
    agency_letterhead_url: '',
    total_budget: 0,
  });

  const [items, setItems] = useState<PPMPItem[]>([]);

  const updateFormData = (field: keyof PPMPFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: PPMPItem = {
      item_name: '',
      description: '',
      project_objective: '',
      project_type: 'Goods',
      project_size: '',
      unit: '',
      quantity: 1,
      unit_cost: 0,
      total_cost: 0,
      budget_category: '',
      recommended_procurement_mode: '',
      pre_procurement_conference: false,
      procurement_start_date: null,
      procurement_end_date: null,
      expected_delivery_period: '',
      source_of_funds: '',
      schedule_quarter: 'Q1',
      supporting_documents: [],
      remarks_additional: '',
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (index: number, updatedItem: PPMPItem) => {
    setItems(prev => prev.map((item, i) => i === index ? updatedItem : item));
    calculateTotalBudget();
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    calculateTotalBudget();
  };

  const calculateTotalBudget = () => {
    const total = items.reduce((sum, item) => sum + item.total_cost, 0);
    updateFormData('total_budget', total);
  };

  // Initialize form data when editing
  useEffect(() => {
    if (editingPPMP) {
      setFormData({
        file_name: editingPPMP.file_name,
        fiscal_year: editingPPMP.fiscal_year,
        status_type: (editingPPMP.status_type || 'INDICATIVE') as 'INDICATIVE' | 'FINAL',
        end_user_unit: editingPPMP.end_user_unit || '',
        prepared_date: editingPPMP.prepared_date ? new Date(editingPPMP.prepared_date) : null,
        submitted_date: editingPPMP.submitted_date ? new Date(editingPPMP.submitted_date) : null,
        agency_letterhead_url: '',
        total_budget: editingPPMP.total_budget,
      });
      
      // Load existing items
      loadExistingItems();
    }
  }, [editingPPMP]);

  const loadExistingItems = async () => {
    if (!editingPPMP) return;
    
    try {
      const { data, error } = await supabase
        .from('ppmp_items')
        .select('*')
        .eq('ppmp_file_id', editingPPMP.id);

      if (error) throw error;
      
      const existingItems: PPMPItem[] = data.map(item => ({
        id: item.id,
        item_name: item.item_name,
        description: item.description || '',
        project_objective: item.project_objective || '',
        project_type: (item.project_type || 'Goods') as PPMPItem['project_type'],
        project_size: item.project_size || '',
        unit: item.unit,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
        budget_category: item.budget_category,
        recommended_procurement_mode: item.recommended_procurement_mode || '',
        pre_procurement_conference: item.pre_procurement_conference || false,
        procurement_start_date: item.procurement_start_date ? new Date(item.procurement_start_date) : null,
        procurement_end_date: item.procurement_end_date ? new Date(item.procurement_end_date) : null,
        expected_delivery_period: item.expected_delivery_period || '',
        source_of_funds: item.source_of_funds || '',
        schedule_quarter: item.schedule_quarter || 'Q1',
        supporting_documents: item.supporting_documents || [],
        remarks_additional: item.remarks_additional || '',
      }));
      
      setItems(existingItems);
    } catch (error) {
      console.error('Error loading existing items:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (editingPPMP) {
        // Update existing PPMP
        const { error: updateError } = await supabase
          .from('ppmp_files')
          .update({
            file_name: formData.file_name,
            fiscal_year: formData.fiscal_year,
            status_type: formData.status_type,
            end_user_unit: formData.end_user_unit,
            prepared_date: formData.prepared_date?.toISOString().split('T')[0] || null,
            submitted_date: formData.submitted_date?.toISOString().split('T')[0] || null,
            total_budget: formData.total_budget,
          })
          .eq('id', editingPPMP.id);

        if (updateError) throw updateError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('ppmp_items')
          .delete()
          .eq('ppmp_file_id', editingPPMP.id);

        if (deleteError) throw deleteError;

        // Insert updated items
        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            ppmp_file_id: editingPPMP.id,
            item_name: item.item_name,
            description: item.description,
            project_objective: item.project_objective,
            project_type: item.project_type,
            project_size: item.project_size,
            unit: item.unit,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
            budget_category: item.budget_category,
            recommended_procurement_mode: item.recommended_procurement_mode,
            pre_procurement_conference: item.pre_procurement_conference,
            procurement_start_date: item.procurement_start_date?.toISOString().split('T')[0] || null,
            procurement_end_date: item.procurement_end_date?.toISOString().split('T')[0] || null,
            expected_delivery_period: item.expected_delivery_period,
            source_of_funds: item.source_of_funds,
            schedule_quarter: item.schedule_quarter,
            supporting_documents: item.supporting_documents,
            remarks_additional: item.remarks_additional,
            remaining_quantity: item.quantity,
            remaining_budget: item.total_cost,
          }));

          const { error: itemsError } = await supabase
            .from('ppmp_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        toast({
          title: "Success",
          description: `PPMP updated successfully`,
        });
      } else {
        // Create new PPMP (existing logic)
        // Get user's department
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('department_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Get department code for PPMP number generation
        const { data: department, error: deptError } = await supabase
          .from('departments')
          .select('code')
          .eq('id', profile.department_id)
          .single();

        if (deptError) throw deptError;

        // Generate PPMP number
        const { data: ppmpNumber, error: numberError } = await supabase
          .rpc('generate_ppmp_number', {
            dept_code: department.code,
            fiscal_year: formData.fiscal_year
          });

        if (numberError) throw numberError;

        // Create PPMP file
        const { data: ppmpFile, error: ppmpError } = await supabase
          .from('ppmp_files')
          .insert({
            file_name: formData.file_name,
            fiscal_year: formData.fiscal_year,
            status_type: formData.status_type,
            end_user_unit: formData.end_user_unit,
            prepared_date: formData.prepared_date?.toISOString().split('T')[0] || null,
            submitted_date: formData.submitted_date?.toISOString().split('T')[0] || null,
            agency_letterhead_url: formData.agency_letterhead_url,
            total_budget: formData.total_budget,
            ppmp_number: ppmpNumber,
            department_id: profile.department_id,
            uploaded_by: user.id,
            prepared_by: user.id,
          })
          .select()
          .single();

        if (ppmpError) throw ppmpError;

        // Create PPMP items
        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            ppmp_file_id: ppmpFile.id,
            item_name: item.item_name,
            description: item.description,
            project_objective: item.project_objective,
            project_type: item.project_type,
            project_size: item.project_size,
            unit: item.unit,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
            budget_category: item.budget_category,
            recommended_procurement_mode: item.recommended_procurement_mode,
            pre_procurement_conference: item.pre_procurement_conference,
            procurement_start_date: item.procurement_start_date?.toISOString().split('T')[0] || null,
            procurement_end_date: item.procurement_end_date?.toISOString().split('T')[0] || null,
            expected_delivery_period: item.expected_delivery_period,
            source_of_funds: item.source_of_funds,
            schedule_quarter: item.schedule_quarter,
            supporting_documents: item.supporting_documents,
            remarks_additional: item.remarks_additional,
            remaining_quantity: item.quantity,
            remaining_budget: item.total_cost,
          }));

          const { error: itemsError } = await supabase
            .from('ppmp_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        toast({
          title: "Success",
          description: `PPMP ${ppmpNumber} created successfully`,
        });
      }

      onComplete();
    } catch (error) {
      console.error('Error saving PPMP:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingPPMP ? 'update' : 'create'} PPMP. Please try again.`,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const steps = [
    { title: "PPMP Information", description: "Basic PPMP details" },
    { title: "Procurement Items", description: "Add procurement items" },
    { title: "Review & Submit", description: "Review and submit PPMP" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">
          {editingPPMP ? 'Edit Project Procurement Management Plan' : 'Create Project Procurement Management Plan'}
        </h2>
        
        {/* Step Indicator */}
        <div className="flex items-center mb-6">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={`flex items-center ${index + 1 <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${index + 1 <= currentStep ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  {index + 1}
                </div>
                <div className="ml-3">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${index + 1 < currentStep ? 'bg-primary' : 'bg-muted-foreground'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: PPMP Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>PPMP Information</CardTitle>
            <CardDescription>Enter the basic information for your PPMP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="file_name">PPMP Title</Label>
                <Input
                  id="file_name"
                  value={formData.file_name}
                  onChange={(e) => updateFormData('file_name', e.target.value)}
                  placeholder="Enter PPMP title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscal_year">Fiscal Year</Label>
                <Select
                  value={formData.fiscal_year.toString()}
                  onValueChange={(value) => updateFormData('fiscal_year', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_type">Status Type</Label>
                <Select
                  value={formData.status_type}
                  onValueChange={(value: 'INDICATIVE' | 'FINAL') => updateFormData('status_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDICATIVE">Indicative</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_user_unit">End User/Implementing Unit</Label>
                <Input
                  id="end_user_unit"
                  value={formData.end_user_unit}
                  onChange={(e) => updateFormData('end_user_unit', e.target.value)}
                  placeholder="Enter implementing unit"
                />
              </div>

              <div className="space-y-2">
                <Label>Prepared Date</Label>
                <DateInput
                  value={formData.prepared_date}
                  onChange={(date) => updateFormData('prepared_date', date)}
                  placeholder="Enter prepared date (MM/DD/YYYY)"
                />
              </div>

              <div className="space-y-2">
                <Label>Submitted Date (Optional)</Label>
                <DateInput
                  value={formData.submitted_date}
                  onChange={(date) => updateFormData('submitted_date', date)}
                  placeholder="Enter submitted date (MM/DD/YYYY)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agency_letterhead">Agency Letterhead URL (Optional)</Label>
              <Input
                id="agency_letterhead"
                value={formData.agency_letterhead_url}
                onChange={(e) => updateFormData('agency_letterhead_url', e.target.value)}
                placeholder="Enter letterhead image URL"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Procurement Items */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Procurement Items</CardTitle>
            <CardDescription>Add and manage procurement items for your PPMP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button onClick={addItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Procurement Item
              </Button>

              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <PPMPItemForm
                    item={item}
                    onChange={(updatedItem) => updateItem(index, updatedItem)}
                  />
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No procurement items added yet. Click "Add Procurement Item" to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>Review your PPMP before submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-medium">PPMP Title:</Label>
                <p>{formData.file_name}</p>
              </div>
              <div>
                <Label className="font-medium">Fiscal Year:</Label>
                <p>{formData.fiscal_year}</p>
              </div>
              <div>
                <Label className="font-medium">Status Type:</Label>
                <p>{formData.status_type}</p>
              </div>
              <div>
                <Label className="font-medium">Total Budget:</Label>
                <p>₱{formData.total_budget.toLocaleString()}</p>
              </div>
              <div>
                <Label className="font-medium">Total Items:</Label>
                <p>{items.length}</p>
              </div>
            </div>

            <div>
              <Label className="font-medium">Procurement Items:</Label>
              <div className="mt-2 space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} × ₱{item.unit_cost.toLocaleString()}
                      </div>
                    </div>
                    <div className="font-medium">₱{item.total_cost.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <div>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={loading}
            >
              Previous
            </Button>
          )}
        </div>

        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={loading || (currentStep === 1 && !formData.file_name)}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || items.length === 0}>
              {loading 
                ? (editingPPMP ? "Updating..." : "Creating...") 
                : (editingPPMP ? "Update PPMP" : "Create PPMP")
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DateInput } from '@/components/ui/date-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { calculateVarianceInfo } from '@/utils/ppmpVariance';

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
  date_of_conduct: Date | null;
  venue: string;
  program_coordinator_id: string | null;
  pr_submitted_date: Date | null;
  pr_actual_amount: number | null;
  po_number: string;
  po_actual_amount: number | null;
  winning_supplier: string;
  dv_prepared_date: Date | null;
  dv_actual_amount: number | null;
  execution_status: 'planned' | 'pr_submitted' | 'po_issued' | 'completed';
}

interface PPMPItemFormProps {
  item: PPMPItem;
  onChange: (item: PPMPItem) => void;
}

export const PPMPItemForm: React.FC<PPMPItemFormProps> = ({ item, onChange }) => {
  const [coordinators, setCoordinators] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    const fetchCoordinators = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (data) setCoordinators(data);
    };
    fetchCoordinators();
  }, []);

  const updateField = (field: keyof PPMPItem, value: any) => {
    const updatedItem = { ...item, [field]: value };
    
    // Auto-calculate total cost when quantity or unit_cost changes
    if (field === 'quantity' || field === 'unit_cost') {
      updatedItem.total_cost = updatedItem.quantity * updatedItem.unit_cost;
    }
    
    onChange(updatedItem);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Column 1: General Description and Objective */}
      <div className="space-y-2">
        <Label htmlFor="item_name">Item Name *</Label>
        <Input
          id="item_name"
          value={item.item_name}
          onChange={(e) => updateField('item_name', e.target.value)}
          placeholder="Enter item name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={item.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Enter item description"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project_objective">Project Objective</Label>
        <Textarea
          id="project_objective"
          value={item.project_objective}
          onChange={(e) => updateField('project_objective', e.target.value)}
          placeholder="Enter project objective"
          rows={2}
        />
      </div>

      {/* Column 2: Project Type and Size */}
      <div className="space-y-2">
        <Label htmlFor="project_type">Project Type *</Label>
        <Select
          value={item.project_type}
          onValueChange={(value: PPMPItem['project_type']) => updateField('project_type', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Infrastructure">Infrastructure</SelectItem>
            <SelectItem value="Consulting Services">Consulting Services</SelectItem>
            <SelectItem value="Goods">Goods</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project_size">Project Size</Label>
        <Input
          id="project_size"
          value={item.project_size}
          onChange={(e) => updateField('project_size', e.target.value)}
          placeholder="Enter project size"
        />
      </div>

      {/* Column 3: Quantity and Size */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          type="number"
          value={item.quantity}
          onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">Unit *</Label>
        <Input
          id="unit"
          value={item.unit}
          onChange={(e) => updateField('unit', e.target.value)}
          placeholder="e.g., pcs, lot, unit"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit_cost">Unit Cost (₱) *</Label>
        <Input
          id="unit_cost"
          type="number"
          value={item.unit_cost}
          onChange={(e) => updateField('unit_cost', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_cost">Total Cost (₱)</Label>
        <Input
          id="total_cost"
          type="number"
          value={item.total_cost}
          readOnly
          className="bg-muted"
        />
      </div>

      {/* Column 4: Budget Category */}
      <div className="space-y-2">
        <Label htmlFor="budget_category">Budget Category *</Label>
        <Select
          value={item.budget_category}
          onValueChange={(value) => updateField('budget_category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select budget category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MOOE">MOOE</SelectItem>
            <SelectItem value="Capital Outlay">Capital Outlay</SelectItem>
            <SelectItem value="PS">Personal Services</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Column 5: Mode of Procurement */}
      <div className="space-y-2">
        <Label htmlFor="recommended_procurement_mode">Recommended Mode of Procurement</Label>
        <Select
          value={item.recommended_procurement_mode}
          onValueChange={(value) => updateField('recommended_procurement_mode', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select procurement mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Public Bidding">Public Bidding</SelectItem>
            <SelectItem value="Alternative Methods">Alternative Methods</SelectItem>
            <SelectItem value="Shopping">Shopping</SelectItem>
            <SelectItem value="Small Value Procurement">Small Value Procurement</SelectItem>
            <SelectItem value="Negotiated Procurement">Negotiated Procurement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Column 6: Pre-procurement Conference */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="pre_procurement_conference"
            checked={item.pre_procurement_conference}
            onCheckedChange={(checked) => updateField('pre_procurement_conference', !!checked)}
          />
          <Label htmlFor="pre_procurement_conference">Pre-procurement Conference</Label>
        </div>
      </div>

      {/* Column 7: Advertisement/Posting of IAEB */}
      <div className="space-y-2">
        <Label>Procurement Start Date</Label>
        <DateInput
          value={item.procurement_start_date}
          onChange={(date) => updateField('procurement_start_date', date)}
          placeholder="Enter start date (MM/DD/YYYY)"
        />
      </div>

      {/* Column 8: Submission/Opening of Bids */}
      <div className="space-y-2">
        <Label>Procurement End Date</Label>
        <DateInput
          value={item.procurement_end_date}
          onChange={(date) => updateField('procurement_end_date', date)}
          placeholder="Enter end date (MM/DD/YYYY)"
        />
      </div>

      {/* Column 9: Notice of Award */}
      <div className="space-y-2">
        <Label htmlFor="expected_delivery_period">Expected Delivery Period</Label>
        <Input
          id="expected_delivery_period"
          value={item.expected_delivery_period}
          onChange={(e) => updateField('expected_delivery_period', e.target.value)}
          placeholder="e.g., 30 days, 2 weeks"
        />
      </div>

      {/* Column 10: Contract Signing */}
      <div className="space-y-2">
        <Label htmlFor="source_of_funds">Source of Funds</Label>
        <Select
          value={item.source_of_funds}
          onValueChange={(value) => updateField('source_of_funds', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select source of funds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GAA">GAA</SelectItem>
            <SelectItem value="Special Purpose Fund">Special Purpose Fund</SelectItem>
            <SelectItem value="Internally Generated Fund">Internally Generated Fund</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Column 11: Notice to Proceed */}
      <div className="space-y-2">
        <Label htmlFor="schedule_quarter">Schedule Quarter</Label>
        <Select
          value={item.schedule_quarter}
          onValueChange={(value) => updateField('schedule_quarter', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Q1">Q1</SelectItem>
            <SelectItem value="Q2">Q2</SelectItem>
            <SelectItem value="Q3">Q3</SelectItem>
            <SelectItem value="Q4">Q4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Column 12: Date of Conduct */}
      <div className="space-y-2">
        <Label>Date of Conduct</Label>
        <DateInput
          value={item.date_of_conduct}
          onChange={(date) => updateField('date_of_conduct', date)}
          placeholder="Enter conduct date (MM/DD/YYYY)"
        />
      </div>

      {/* Column 13: Venue */}
      <div className="space-y-2">
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          value={item.venue}
          onChange={(e) => updateField('venue', e.target.value)}
          placeholder="e.g., Conference Room A, City Hall"
        />
      </div>

      {/* Column 14: Program Coordinator */}
      <div className="space-y-2">
        <Label htmlFor="program_coordinator_id">Program Coordinator</Label>
        <Select
          value={item.program_coordinator_id || ''}
          onValueChange={(value) => updateField('program_coordinator_id', value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select coordinator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {coordinators.map((coord) => (
              <SelectItem key={coord.id} value={coord.id}>
                {coord.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Column 15: Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks_additional">Remarks</Label>
        <Textarea
          id="remarks_additional"
          value={item.remarks_additional}
          onChange={(e) => updateField('remarks_additional', e.target.value)}
          placeholder="Additional remarks"
          rows={2}
        />
      </div>

      {/* Execution Tracking Section (spans all columns) */}
      <div className="col-span-full mt-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="execution">
            <AccordionTrigger className="text-lg font-semibold">
              Execution Tracking & Budget Variance
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* PR Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm">Purchase Request (PR)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="pr_submitted_date">PR Submitted Date</Label>
                    <DateInput
                      value={item.pr_submitted_date}
                      onChange={(date) => updateField('pr_submitted_date', date)}
                      placeholder="Select PR date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pr_actual_amount">PR Actual Amount</Label>
                    <Input
                      id="pr_actual_amount"
                      type="number"
                      value={item.pr_actual_amount || ''}
                      onChange={(e) => updateField('pr_actual_amount', parseFloat(e.target.value) || null)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* PO Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm">Purchase Order (PO)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="po_number">PO Number</Label>
                    <Input
                      id="po_number"
                      value={item.po_number}
                      onChange={(e) => updateField('po_number', e.target.value)}
                      placeholder="PO-000001-2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="po_actual_amount">PO Actual Amount</Label>
                    <Input
                      id="po_actual_amount"
                      type="number"
                      value={item.po_actual_amount || ''}
                      onChange={(e) => updateField('po_actual_amount', parseFloat(e.target.value) || null)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="winning_supplier">Winning Supplier</Label>
                    <Input
                      id="winning_supplier"
                      value={item.winning_supplier}
                      onChange={(e) => updateField('winning_supplier', e.target.value)}
                      placeholder="Supplier name"
                    />
                  </div>
                </div>

                {/* DV Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm">Disbursement Voucher (DV)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="dv_prepared_date">DV Prepared Date</Label>
                    <DateInput
                      value={item.dv_prepared_date}
                      onChange={(date) => updateField('dv_prepared_date', date)}
                      placeholder="Select DV date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dv_actual_amount">DV Actual Amount</Label>
                    <Input
                      id="dv_actual_amount"
                      type="number"
                      value={item.dv_actual_amount || ''}
                      onChange={(e) => updateField('dv_actual_amount', parseFloat(e.target.value) || null)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="execution_status">Execution Status</Label>
                    <Select
                      value={item.execution_status}
                      onValueChange={(value: PPMPItem['execution_status']) => updateField('execution_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="pr_submitted">PR Submitted</SelectItem>
                        <SelectItem value="po_issued">PO Issued</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Budget Variance Display */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Budget Variance Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Planned Amount</p>
                    <p className="text-lg font-semibold">
                      ₱{item.total_cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Amount</p>
                    <p className="text-lg font-semibold">
                      ₱{(item.dv_actual_amount || item.po_actual_amount || item.pr_actual_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Variance</p>
                    <p className={`text-lg font-semibold ${calculateVarianceInfo(item).color}`}>
                      ₱{Math.abs(calculateVarianceInfo(item).variance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={calculateVarianceInfo(item).variance > 0 ? 'default' : calculateVarianceInfo(item).variance < 0 ? 'destructive' : 'secondary'}>
                      {calculateVarianceInfo(item).status} ({calculateVarianceInfo(item).variancePercentage.toFixed(1)}%)
                    </Badge>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
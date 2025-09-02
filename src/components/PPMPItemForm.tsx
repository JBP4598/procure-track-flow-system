import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DateInput } from '@/components/ui/date-input';

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

interface PPMPItemFormProps {
  item: PPMPItem;
  onChange: (item: PPMPItem) => void;
}

export const PPMPItemForm: React.FC<PPMPItemFormProps> = ({ item, onChange }) => {
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

      {/* Column 12: Delivery/Completion */}
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
    </div>
  );
};
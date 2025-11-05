import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface IARItem {
  id: string;
  po_item_id: string;
  inspected_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  result: 'accepted' | 'rejected' | 'requires_reinspection';
  remarks: string | null;
  po_items?: {
    id: string;
    quantity: number;
    unit_cost: number;
    pr_items?: {
      item_name: string;
      description: string | null;
      unit: string;
    };
  };
}

interface EditIARItemsFormProps {
  iarItems: IARItem[];
  onItemsChange: (items: IARItem[]) => void;
}

export const EditIARItemsForm: React.FC<EditIARItemsFormProps> = ({
  iarItems,
  onItemsChange,
}) => {
  const updateIARItem = (index: number, field: string, value: any) => {
    const updatedItems = [...iarItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    const item = updatedItems[index];

    // Auto-calculate accepted quantity when inspected quantity changes
    if (field === 'inspected_quantity') {
      item.accepted_quantity = value;
      item.rejected_quantity = 0;
    }

    // Auto-calculate accepted quantity when rejected quantity changes
    if (field === 'rejected_quantity') {
      const rejectedQty = Math.min(value, item.inspected_quantity);
      item.rejected_quantity = rejectedQty;
      item.accepted_quantity = item.inspected_quantity - rejectedQty;
    }

    // Auto-calculate result based on quantities
    if (field === 'inspected_quantity' || field === 'accepted_quantity' || field === 'rejected_quantity') {
      if (item.rejected_quantity > 0 && item.accepted_quantity > 0) {
        item.result = 'requires_reinspection';
      } else if (item.rejected_quantity > 0) {
        item.result = 'rejected';
      } else {
        item.result = 'accepted';
      }
    }

    onItemsChange(updatedItems);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      case 'requires_reinspection':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Requires Reinspection</Badge>;
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {iarItems.map((iarItem, index) => {
        const poItem = iarItem.po_items;
        const prItem = poItem?.pr_items;

        return (
          <Card key={iarItem.id} className="p-4">
            <div className="space-y-4">
              {/* Item Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{prItem?.item_name || 'Unknown Item'}</h4>
                  {prItem?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{prItem.description}</p>
                  )}
                </div>
                {getResultBadge(iarItem.result)}
              </div>

              {/* Reference Information */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="text-xs text-muted-foreground">PO Quantity</p>
                  <p className="font-medium">{poItem?.quantity || 0} {prItem?.unit || 'units'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit Cost</p>
                  <p className="font-medium">{formatCurrency(poItem?.unit_cost || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="font-medium">{formatCurrency((poItem?.quantity || 0) * (poItem?.unit_cost || 0))}</p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`inspected-${index}`}>Inspected Quantity</Label>
                  <Input
                    id={`inspected-${index}`}
                    type="number"
                    min="0"
                    value={iarItem.inspected_quantity}
                    onChange={(e) => updateIARItem(index, 'inspected_quantity', parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`rejected-${index}`}>Rejected Quantity</Label>
                  <Input
                    id={`rejected-${index}`}
                    type="number"
                    min="0"
                    max={iarItem.inspected_quantity}
                    value={iarItem.rejected_quantity}
                    onChange={(e) => updateIARItem(index, 'rejected_quantity', parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`accepted-${index}`}>Accepted Quantity</Label>
                  <Input
                    id={`accepted-${index}`}
                    type="number"
                    value={iarItem.accepted_quantity}
                    readOnly
                    className="w-full bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated</p>
                </div>
              </div>

              {/* Result and Remarks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`result-${index}`}>Inspection Result</Label>
                  <Select
                    value={iarItem.result}
                    onValueChange={(value) => updateIARItem(index, 'result', value)}
                    disabled
                  >
                    <SelectTrigger id={`result-${index}`} className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="requires_reinspection">Requires Reinspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Auto-determined by quantities</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`remarks-${index}`}>Remarks</Label>
                  <Textarea
                    id={`remarks-${index}`}
                    value={iarItem.remarks || ''}
                    onChange={(e) => updateIARItem(index, 'remarks', e.target.value)}
                    placeholder="Add any remarks or notes about this item..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface POItem {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  delivered_quantity: number | null;
  remaining_quantity: number | null;
  pr_items: {
    item_name: string;
    description: string;
    unit: string;
    budget_category: string;
  };
}

interface IARItem {
  po_item_id: string;
  inspected_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  result: 'accepted' | 'rejected' | 'requires_reinspection';
  remarks: string;
}

interface IARItemsFormProps {
  poItems: POItem[];
  iarItems: IARItem[];
  onItemsChange: (items: IARItem[]) => void;
}

export const IARItemsForm: React.FC<IARItemsFormProps> = ({
  poItems,
  iarItems,
  onItemsChange,
}) => {
  const updateIARItem = (index: number, field: keyof IARItem, value: any) => {
    const updatedItems = [...iarItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-calculate result based on quantities
    if (field === 'accepted_quantity' || field === 'rejected_quantity') {
      const item = updatedItems[index];
      const totalProcessed = item.accepted_quantity + item.rejected_quantity;
      
      if (item.rejected_quantity > 0 && item.accepted_quantity > 0) {
        item.result = 'requires_reinspection';
      } else if (item.rejected_quantity > 0) {
        item.result = 'rejected';
      } else {
        item.result = 'accepted';
      }

      // Ensure quantities don't exceed inspected quantity
      if (totalProcessed > item.inspected_quantity) {
        if (field === 'accepted_quantity') {
          item.accepted_quantity = item.inspected_quantity - item.rejected_quantity;
        } else {
          item.rejected_quantity = item.inspected_quantity - item.accepted_quantity;
        }
      }
    }

    onItemsChange(updatedItems);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Items for Inspection</h3>
      
      {poItems.map((poItem, index) => {
        const iarItem = iarItems[index];
        const totalProcessed = iarItem.accepted_quantity + iarItem.rejected_quantity;
        
        return (
          <Card key={poItem.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {poItem.pr_items.item_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {poItem.pr_items.description} | {poItem.pr_items.budget_category}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">PO Quantity:</span>
                  <p>{poItem.quantity} {poItem.pr_items.unit}</p>
                </div>
                <div>
                  <span className="font-medium">Unit Cost:</span>
                  <p>{formatCurrency(poItem.unit_cost)}</p>
                </div>
                <div>
                  <span className="font-medium">Delivered:</span>
                  <p>{poItem.delivered_quantity || 0} {poItem.pr_items.unit}</p>
                </div>
                <div>
                  <span className="font-medium">Remaining:</span>
                  <p>{poItem.remaining_quantity || poItem.quantity} {poItem.pr_items.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Inspected Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    max={poItem.remaining_quantity || poItem.quantity}
                    value={iarItem.inspected_quantity}
                    onChange={(e) => updateIARItem(index, 'inspected_quantity', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Accepted Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    max={iarItem.inspected_quantity}
                    value={iarItem.accepted_quantity}
                    onChange={(e) => updateIARItem(index, 'accepted_quantity', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rejected Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    max={iarItem.inspected_quantity}
                    value={iarItem.rejected_quantity}
                    onChange={(e) => updateIARItem(index, 'rejected_quantity', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Result</Label>
                  <Select
                    value={iarItem.result}
                    onValueChange={(value) => updateIARItem(index, 'result', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="requires_reinspection">Requires Reinspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {totalProcessed !== iarItem.inspected_quantity && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Total processed ({totalProcessed}) doesn't match inspected quantity ({iarItem.inspected_quantity})
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Item Remarks</Label>
                <Textarea
                  value={iarItem.remarks}
                  onChange={(e) => updateIARItem(index, 'remarks', e.target.value)}
                  placeholder="Enter any remarks specific to this item..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
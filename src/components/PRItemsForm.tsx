import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PRItem {
  id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  budget_category: string;
  ppmp_item_id?: string;
  remarks?: string;
}

interface PPMPItem {
  id: string;
  item_name: string;
  description: string;
  unit: string;
  unit_cost: number;
  budget_category: string;
  remaining_quantity: number;
  remaining_budget: number;
}

interface PRItemsFormProps {
  items: PRItem[];
  onItemsChange: (items: PRItem[]) => void;
}

export const PRItemsForm: React.FC<PRItemsFormProps> = ({ items, onItemsChange }) => {
  const [ppmpItems, setPpmpItems] = useState<PPMPItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchPPMPItems();
  }, [user]);

  const fetchPPMPItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ppmp_items')
        .select(`
          id,
          item_name,
          description,
          unit,
          unit_cost,
          budget_category,
          remaining_quantity,
          remaining_budget,
          ppmp_files!inner (
            department_id
          )
        `)
        .gt('remaining_quantity', 0);

      if (error) throw error;
      setPpmpItems(data || []);
    } catch (error) {
      console.error('Error fetching PPMP items:', error);
    }
  };

  const addItem = () => {
    const newItem: PRItem = {
      item_name: '',
      description: '',
      quantity: 1,
      unit: '',
      unit_cost: 0,
      total_cost: 0,
      budget_category: '',
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const updateItem = (index: number, field: keyof PRItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total cost
    if (field === 'quantity' || field === 'unit_cost') {
      newItems[index].total_cost = newItems[index].quantity * newItems[index].unit_cost;
    }
    
    onItemsChange(newItems);
  };

  const selectPPMPItem = (index: number, ppmpItemId: string) => {
    const ppmpItem = ppmpItems.find(item => item.id === ppmpItemId);
    if (ppmpItem) {
      updateItem(index, 'ppmp_item_id', ppmpItemId);
      updateItem(index, 'item_name', ppmpItem.item_name);
      updateItem(index, 'description', ppmpItem.description || '');
      updateItem(index, 'unit', ppmpItem.unit);
      updateItem(index, 'unit_cost', ppmpItem.unit_cost);
      updateItem(index, 'budget_category', ppmpItem.budget_category);
      updateItem(index, 'total_cost', items[index].quantity * ppmpItem.unit_cost);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total_cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Purchase Request Items</h3>
        <Button onClick={addItem} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {items.map((item, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex justify-between items-center">
              Item {index + 1}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select from PPMP (Optional)</Label>
                <Select onValueChange={(value) => selectPPMPItem(index, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose PPMP item" />
                  </SelectTrigger>
                  <SelectContent>
                    {ppmpItems.map((ppmpItem) => (
                      <SelectItem key={ppmpItem.id} value={ppmpItem.id}>
                        {ppmpItem.item_name} - {ppmpItem.unit} (Available: {ppmpItem.remaining_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget Category</Label>
                <Input
                  value={item.budget_category}
                  onChange={(e) => updateItem(index, 'budget_category', e.target.value)}
                  placeholder="e.g., Office Supplies, IT Equipment"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={item.item_name}
                  onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={item.unit}
                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                  placeholder="e.g., piece, box, kg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                placeholder="Item description and specifications"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Cost (₱)</Label>
                <Input
                  type="number"
                  value={item.unit_cost}
                  onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Total Cost (₱)</Label>
                <Input
                  type="number"
                  value={item.total_cost.toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={item.remarks || ''}
                onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                placeholder="Additional notes or requirements"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No items added yet</p>
            <Button onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span>₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
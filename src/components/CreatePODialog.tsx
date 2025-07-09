import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PurchaseRequest {
  id: string;
  pr_number: string;
  purpose: string;
  status: string;
  total_amount: number;
  pr_items: Array<{
    id: string;
    item_name: string;
    description: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
    budget_category: string;
  }>;
}

interface CreatePODialogProps {
  onPOCreated: () => void;
}

export function CreatePODialog({ onPOCreated }: CreatePODialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approvedPRs, setApprovedPRs] = useState<PurchaseRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_address: '',
    supplier_contact: '',
    terms_conditions: '',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchApprovedPRs = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          id,
          pr_number,
          purpose,
          status,
          total_amount,
          pr_items (
            id,
            item_name,
            description,
            quantity,
            unit,
            unit_cost,
            total_cost,
            budget_category
          )
        `)
        .eq('status', 'approved');

      if (error) throw error;
      setApprovedPRs(data || []);
    } catch (error) {
      console.error('Error fetching approved PRs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approved purchase requests',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchApprovedPRs();
    }
  }, [open]);

  const selectedPRData = approvedPRs.find(pr => pr.id === selectedPR);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const calculateTotal = () => {
    if (!selectedPRData) return 0;
    return selectedPRData.pr_items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.total_cost, 0);
  };

  const generatePONumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-4);
    return `PO-${year}${month}${day}-${time}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPR || selectedItems.length === 0) return;

    setLoading(true);
    try {
      const poNumber = generatePONumber();
      const totalAmount = calculateTotal();

      // Create Purchase Order
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_name: formData.supplier_name,
          supplier_address: formData.supplier_address,
          supplier_contact: formData.supplier_contact,
          terms_conditions: formData.terms_conditions,
          delivery_date: deliveryDate?.toISOString().split('T')[0],
          total_amount: totalAmount,
          created_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create PO Items
      const selectedPRItems = selectedPRData!.pr_items.filter(item => 
        selectedItems.includes(item.id)
      );

      const poItemsData = selectedPRItems.map(item => ({
        po_id: poData.id,
        pr_item_id: item.id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
      }));

      const { error: itemsError } = await supabase
        .from('po_items')
        .insert(poItemsData);

      if (itemsError) throw itemsError;

      // Update PR status to 'awarded'
      const { error: updateError } = await supabase
        .from('purchase_requests')
        .update({ status: 'awarded' })
        .eq('id', selectedPR);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: `Purchase Order ${poNumber} created successfully`,
      });

      setOpen(false);
      onPOCreated();
      
      // Reset form
      setSelectedPR('');
      setSelectedItems([]);
      setDeliveryDate(undefined);
      setFormData({
        supplier_name: '',
        supplier_address: '',
        supplier_contact: '',
        terms_conditions: '',
      });
    } catch (error) {
      console.error('Error creating PO:', error);
      toast({
        title: 'Error',
        description: 'Failed to create purchase order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Create a purchase order from approved purchase requests
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Purchase Request Selection */}
          <div className="space-y-2">
            <Label htmlFor="pr_select">Select Purchase Request</Label>
            <Select value={selectedPR} onValueChange={setSelectedPR}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an approved PR" />
              </SelectTrigger>
              <SelectContent>
                {approvedPRs.map((pr) => (
                  <SelectItem key={pr.id} value={pr.id}>
                    {pr.pr_number} - {pr.purpose} (₱{pr.total_amount.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Selection */}
          {selectedPRData && (
            <div className="space-y-2">
              <Label>Select Items for PO</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {selectedPRData.pr_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 border rounded">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.description} • {item.quantity} {item.unit} @ ₱{item.unit_cost.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium">
                        Total: ₱{item.total_cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedItems.length > 0 && (
                <div className="text-right text-lg font-bold">
                  PO Total: ₱{calculateTotal().toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Supplier Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier Name *</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_contact">Contact Information</Label>
              <Input
                id="supplier_contact"
                value={formData.supplier_contact}
                onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                placeholder="Phone/Email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_address">Supplier Address</Label>
            <Textarea
              id="supplier_address"
              value={formData.supplier_address}
              onChange={(e) => setFormData({ ...formData, supplier_address: e.target.value })}
              rows={3}
            />
          </div>

          {/* Delivery Date */}
          <div className="space-y-2">
            <Label>Expected Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms and Conditions</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              rows={4}
              placeholder="Payment terms, delivery conditions, etc."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedPR || selectedItems.length === 0 || !formData.supplier_name}
            >
              {loading ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
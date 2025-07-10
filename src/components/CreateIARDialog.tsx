import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { IARItemsForm } from '@/components/IARItemsForm';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  delivery_date: string;
  total_amount: number;
}

interface CreateIARDialogProps {
  onIARCreated: () => void;
}

export const CreateIARDialog: React.FC<CreateIARDialogProps> = ({ onIARCreated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availablePOs, setAvailablePOs] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState('');
  const [formData, setFormData] = useState({
    iar_number: '',
    inspection_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [poItems, setPOItems] = useState<any[]>([]);
  const [iarItems, setIARItems] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAvailablePOs();
      generateIARNumber();
    }
  }, [open]);

  useEffect(() => {
    if (selectedPO) {
      fetchPOItems();
    }
  }, [selectedPO]);

  const generateIARNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    setFormData(prev => ({
      ...prev,
      iar_number: `IAR-${timestamp}`
    }));
  };

  const fetchAvailablePOs = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, po_number, supplier_name, delivery_date, total_amount')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailablePOs(data || []);
    } catch (error) {
      console.error('Error fetching available POs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available purchase orders.",
        variant: "destructive",
      });
    }
  };

  const fetchPOItems = async () => {
    try {
      const { data, error } = await supabase
        .from('po_items')
        .select(`
          id,
          quantity,
          unit_cost,
          total_cost,
          delivered_quantity,
          remaining_quantity,
          pr_items (
            item_name,
            description,
            unit,
            budget_category
          )
        `)
        .eq('po_id', selectedPO)
        .eq('cancelled', false);

      if (error) throw error;
      
      setPOItems(data || []);
      
      // Initialize IAR items based on PO items
      const initialIARItems = (data || []).map(item => ({
        po_item_id: item.id,
        inspected_quantity: item.remaining_quantity || item.quantity,
        accepted_quantity: 0,
        rejected_quantity: 0,
        result: 'accepted' as const,
        remarks: '',
      }));
      
      setIARItems(initialIARItems);
    } catch (error) {
      console.error('Error fetching PO items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase order items.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPO) return;

    setLoading(true);
    try {
      // Calculate overall result
      const hasRejected = iarItems.some(item => item.rejected_quantity > 0);
      const hasAccepted = iarItems.some(item => item.accepted_quantity > 0);
      const overallResult = hasRejected ? (hasAccepted ? 'requires_reinspection' : 'rejected') : 'accepted';

      // Create inspection report
      const { data: iar, error: iarError } = await supabase
        .from('inspection_reports')
        .insert({
          iar_number: formData.iar_number,
          po_id: selectedPO,
          inspector_id: user.id,
          inspection_date: formData.inspection_date,
          overall_result: overallResult,
          remarks: formData.remarks,
        })
        .select()
        .single();

      if (iarError) throw iarError;

      // Create IAR items
      const iarItemsData = iarItems.map(item => ({
        ...item,
        iar_id: iar.id,
      }));

      const { error: itemsError } = await supabase
        .from('iar_items')
        .insert(iarItemsData);

      if (itemsError) throw itemsError;

      // Update PO items delivery status
      for (const item of iarItems) {
        const poItem = poItems.find(po => po.id === item.po_item_id);
        if (poItem) {
          const newDeliveredQuantity = (poItem.delivered_quantity || 0) + item.accepted_quantity;
          const newRemainingQuantity = poItem.quantity - newDeliveredQuantity;
          
          await supabase
            .from('po_items')
            .update({
              delivered_quantity: newDeliveredQuantity,
              remaining_quantity: newRemainingQuantity,
            })
            .eq('id', item.po_item_id);
        }
      }

      toast({
        title: "Success",
        description: "Inspection report created successfully.",
      });

      setOpen(false);
      onIARCreated();
      resetForm();
    } catch (error) {
      console.error('Error creating IAR:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      iar_number: '',
      inspection_date: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setSelectedPO('');
    setPOItems([]);
    setIARItems([]);
  };

  const handleIARItemsChange = (updatedItems: any[]) => {
    setIARItems(updatedItems);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create IAR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Inspection & Acceptance Report</DialogTitle>
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
            <Label htmlFor="po_id">Purchase Order</Label>
            <Select value={selectedPO} onValueChange={setSelectedPO} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a purchase order to inspect" />
              </SelectTrigger>
              <SelectContent>
                {availablePOs.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.po_number} - {po.supplier_name} (₱{po.total_amount.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {poItems.length > 0 && (
            <IARItemsForm
              poItems={poItems}
              iarItems={iarItems}
              onItemsChange={handleIARItemsChange}
            />
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPO}>
              {loading ? 'Creating...' : 'Create IAR'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
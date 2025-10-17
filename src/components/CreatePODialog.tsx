import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Plus, Loader2 } from 'lucide-react';
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
  const [fetchingPRs, setFetchingPRs] = useState(false);
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
    setFetchingPRs(true);
    try {
      // First fetch approved PRs
      const { data: prsData, error: prError } = await supabase
        .from('purchase_requests')
        .select('id, pr_number, purpose, status, total_amount')
        .eq('status', 'approved');

      if (prError) throw prError;

      if (!prsData || prsData.length === 0) {
        setApprovedPRs([]);
        return;
      }

      // Then fetch PR items for each approved PR
      const prIds = prsData.map(pr => pr.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('pr_items')
        .select(`
          id,
          pr_id,
          item_name,
          description,
          quantity,
          unit,
          unit_cost,
          total_cost,
          budget_category
        `)
        .in('pr_id', prIds);

      if (itemsError) throw itemsError;

      // Combine PRs with their items
      const prsWithItems = prsData.map(pr => ({
        ...pr,
        pr_items: itemsData?.filter(item => item.pr_id === pr.id) || []
      }));

      setApprovedPRs(prsWithItems);
    } catch (error) {
      console.error('Error fetching approved PRs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approved purchase requests',
        variant: 'destructive',
      });
    } finally {
      setFetchingPRs(false);
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
    if (!selectedPR || selectedItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a PR and at least one item',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.supplier_name) {
      toast({
        title: 'Error', 
        description: 'Supplier name is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const attemptPOCreation = async (retryCount = 0): Promise<boolean> => {
      try {
        // Step 1: Refresh the session to ensure we have a valid token
        console.log(`[PO Creation Attempt ${retryCount + 1}] Refreshing session...`);
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('[PO Creation] Session refresh error:', refreshError);
          throw new Error('Failed to refresh authentication session');
        }

        if (!refreshData.session) {
          console.error('[PO Creation] No session after refresh');
          throw new Error('No active session found');
        }

        console.log('[PO Creation] Session refreshed successfully');
        console.log('[PO Creation] Access token present:', !!refreshData.session.access_token);
        console.log('[PO Creation] User ID:', refreshData.session.user.id);

        // Step 2: Verify we can get the current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          console.error('[PO Creation] User verification failed:', userError);
          throw new Error('Failed to verify user authentication');
        }

        console.log('[PO Creation] User verified:', currentUser.id);

        const poNumber = generatePONumber();
        const totalAmount = calculateTotal();

        console.log('[PO Creation] Attempting to insert PO:', {
          po_number: poNumber,
          created_by: currentUser.id,
          total_amount: totalAmount,
        });

        // Step 3: Create Purchase Order with the refreshed session
        const { data: poData, error: poError } = await supabase
          .from('purchase_orders')
          .insert({
            po_number: poNumber,
            supplier_name: formData.supplier_name,
            supplier_address: formData.supplier_address || null,
            supplier_contact: formData.supplier_contact || null,
            terms_conditions: formData.terms_conditions || null,
            delivery_date: deliveryDate?.toISOString().split('T')[0] || null,
            total_amount: totalAmount,
            created_by: currentUser.id,
            status: 'pending',
          })
          .select()
          .single();

        if (poError) {
          console.error('[PO Creation] Database error:', {
            code: poError.code,
            message: poError.message,
            details: poError.details,
            hint: poError.hint,
          });

          // If it's an RLS error and we haven't retried yet, try again
          if ((poError.code === '42501' || poError.message?.includes('row-level security')) && retryCount === 0) {
            console.log('[PO Creation] RLS error detected, retrying with fresh session...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return attemptPOCreation(retryCount + 1);
          }

          if (poError.code === '42501' || poError.message?.includes('row-level security')) {
            toast({
              title: 'Permission Error',
              description: 'You need BAC or Admin role to create Purchase Orders. Please contact your administrator.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description: 'Failed to create Purchase Order: ' + poError.message,
              variant: 'destructive',
            });
          }
          throw poError;
        }

        console.log('[PO Creation] PO created successfully:', poData.id);

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

        if (itemsError) {
          console.error('[PO Creation] Failed to insert PO items:', itemsError);
          throw itemsError;
        }

        // Update PR status to 'awarded'
        const { error: updateError } = await supabase
          .from('purchase_requests')
          .update({ status: 'awarded' })
          .eq('id', selectedPR);

        if (updateError) {
          console.error('[PO Creation] Failed to update PR status:', updateError);
          throw updateError;
        }

        console.log('[PO Creation] Process completed successfully');

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

        return true;
      } catch (error) {
        console.error(`[PO Creation Attempt ${retryCount + 1}] Error:`, error);
        if (retryCount === 0) {
          return false; // Will trigger retry
        }
        throw error; // Re-throw on second attempt
      }
    };

    try {
      const success = await attemptPOCreation();
      if (!success) {
        // First attempt failed, try one more time
        console.log('[PO Creation] First attempt failed, retrying...');
        await attemptPOCreation(1);
      }
    } catch (error) {
      console.error('[PO Creation] All attempts failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create purchase order';
      
      if (!errorMessage.includes('Permission Error') && !errorMessage.includes('BAC or Admin')) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
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
            <Select value={selectedPR} onValueChange={setSelectedPR} disabled={fetchingPRs}>
              <SelectTrigger>
                <SelectValue placeholder={fetchingPRs ? "Loading approved PRs..." : "Choose an approved PR"} />
              </SelectTrigger>
              <SelectContent>
                {approvedPRs.length === 0 && !fetchingPRs ? (
                  <SelectItem value="no-prs" disabled>
                    No approved PRs available
                  </SelectItem>
                ) : (
                  approvedPRs.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id}>
                      {pr.pr_number} - {pr.purpose} (₱{pr.total_amount.toLocaleString()})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {fetchingPRs && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading approved purchase requests...
              </div>
            )}
          </div>

          {/* Items Selection */}
          {selectedPRData && (
            <div className="space-y-2">
              <Label>Select Items for PO</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {selectedPRData.pr_items.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No items found in this purchase request
                  </div>
                ) : (
                  selectedPRData.pr_items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 border rounded hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.description} • {item.quantity} {item.unit} @ ₱{item.unit_cost.toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-primary">
                          Total: ₱{item.total_cost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
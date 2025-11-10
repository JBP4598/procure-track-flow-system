import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type InspectionReport = Database['public']['Tables']['inspection_reports']['Row'] & {
  purchase_orders: Database['public']['Tables']['purchase_orders']['Row'];
};

interface CreateDVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateDVDialog: React.FC<CreateDVDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    dv_number: '',
    iar_id: '',
    po_id: '',
    payee_name: '',
    amount: '',
    payment_method: 'check',
    check_number: '',
  });

  // Fetch accepted IARs that don't have DVs yet
  const { data: availableIARs } = useQuery({
    queryKey: ['available-iars'],
    queryFn: async () => {
      // Step 1: Fetch all accepted IARs
      const { data: acceptedIARs, error: iarsError } = await supabase
        .from('inspection_reports')
        .select(`
          *,
          purchase_orders (*)
        `)
        .eq('overall_result', 'accepted');

      if (iarsError) throw iarsError;

      // Step 2: Fetch all IAR IDs that already have DVs
      const { data: existingDVs, error: dvsError } = await supabase
        .from('disbursement_vouchers')
        .select('iar_id');

      if (dvsError) throw dvsError;

      // Step 3: Filter out IARs that already have DVs
      const usedIARIds = new Set(existingDVs?.map(dv => dv.iar_id) || []);
      const availableIARs = acceptedIARs?.filter(
        iar => !usedIARIds.has(iar.id)
      ) || [];

      return availableIARs as InspectionReport[];
    },
  });

  const createDVMutation = useMutation({
    mutationFn: async (dvData: any) => {
      const { data, error } = await supabase
        .from('disbursement_vouchers')
        .insert([{
          ...dvData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Disbursement voucher created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['disbursement-vouchers'] });
      onOpenChange(false);
      setFormData({
        dv_number: '',
        iar_id: '',
        po_id: '',
        payee_name: '',
        amount: '',
        payment_method: 'check',
        check_number: '',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create disbursement voucher: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedIAR = availableIARs?.find(iar => iar.id === formData.iar_id);
    if (!selectedIAR) return;

    createDVMutation.mutate({
      dv_number: formData.dv_number,
      iar_id: formData.iar_id,
      po_id: selectedIAR.po_id,
      payee_name: formData.payee_name,
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method,
      check_number: formData.payment_method === 'check' ? formData.check_number : null,
    });
  };

  const handleIARSelect = (iarId: string) => {
    const selectedIAR = availableIARs?.find(iar => iar.id === iarId);
    if (selectedIAR) {
      setFormData(prev => ({
        ...prev,
        iar_id: iarId,
        po_id: selectedIAR.po_id,
        payee_name: selectedIAR.purchase_orders.supplier_name,
        amount: selectedIAR.purchase_orders.total_amount.toString(),
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Disbursement Voucher</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dv_number">DV Number *</Label>
              <Input
                id="dv_number"
                value={formData.dv_number}
                onChange={(e) => setFormData(prev => ({ ...prev, dv_number: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="iar_id">Inspection Report *</Label>
              <Select value={formData.iar_id} onValueChange={handleIARSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an accepted IAR" />
                </SelectTrigger>
                <SelectContent>
                  {availableIARs?.map((iar) => (
                    <SelectItem key={iar.id} value={iar.id}>
                      {iar.iar_number} - PO: {iar.purchase_orders.po_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="payee_name">Payee Name *</Label>
            <Input
              id="payee_name"
              value={formData.payee_name}
              onChange={(e) => setFormData(prev => ({ ...prev, payee_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.payment_method === 'check' && (
            <div>
              <Label htmlFor="check_number">Check Number</Label>
              <Input
                id="check_number"
                value={formData.check_number}
                onChange={(e) => setFormData(prev => ({ ...prev, check_number: e.target.value }))}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDVMutation.isPending}>
              {createDVMutation.isPending ? 'Creating...' : 'Create DV'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
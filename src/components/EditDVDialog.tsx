import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  payee_name: z.string().min(1, 'Payee name is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_method: z.enum(['check', 'bank_transfer', 'cash']),
  check_number: z.string().optional(),
  status: z.enum(['for_signature', 'submitted', 'processed']),
  payment_date: z.date().optional(),
}).refine((data) => {
  if (data.status === 'processed' && !data.payment_date) {
    return false;
  }
  return true;
}, {
  message: 'Payment date is required when status is processed',
  path: ['payment_date'],
}).refine((data) => {
  if (data.payment_method === 'check' && data.status === 'processed' && !data.check_number) {
    return false;
  }
  return true;
}, {
  message: 'Check number is required for check payments',
  path: ['check_number'],
});

type FormData = z.infer<typeof formSchema>;

interface EditDVDialogProps {
  dv: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditDVDialog: React.FC<EditDVDialogProps> = ({
  dv,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (dv && open) {
      form.reset({
        payee_name: dv.payee_name,
        amount: dv.amount,
        payment_method: dv.payment_method || 'check',
        check_number: dv.check_number || '',
        status: dv.status || 'for_signature',
        payment_date: dv.payment_date ? new Date(dv.payment_date) : undefined,
      });
    }
  }, [dv, open, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const updates: any = {
        payee_name: data.payee_name,
        amount: data.amount,
        payment_method: data.payment_method,
        check_number: data.check_number || null,
        status: data.status,
        payment_date: data.payment_date ? format(data.payment_date, 'yyyy-MM-dd') : null,
      };

      // If status is being changed to processed and wasn't before
      if (data.status === 'processed' && dv?.status !== 'processed') {
        const user = await supabase.auth.getUser();
        updates.processed_at = new Date().toISOString();
        updates.processed_by = user.data.user?.id;
      }

      const { error } = await supabase
        .from('disbursement_vouchers')
        .update(updates)
        .eq('id', dv?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Disbursement voucher updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['disbursement-vouchers'] });
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update DV: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  const watchPaymentMethod = form.watch('payment_method');
  const watchStatus = form.watch('status');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Disbursement Voucher</DialogTitle>
          <DialogDescription>
            Update payment details and status for {dv?.dv_number}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="payee_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payee Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchPaymentMethod === 'check' && (
              <FormField
                control={form.control}
                name="check_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Number {watchStatus === 'processed' && '*'}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="for_signature">For Signature</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchStatus === 'processed' && (
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

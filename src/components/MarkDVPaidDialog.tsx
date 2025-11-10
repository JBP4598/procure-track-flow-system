import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  payment_date: z.date({
    required_error: 'Payment date is required',
  }).refine((date) => date <= new Date(), {
    message: 'Payment date cannot be in the future',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface MarkDVPaidDialogProps {
  dv: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const MarkDVPaidDialog: React.FC<MarkDVPaidDialogProps> = ({
  dv,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_date: new Date(),
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('disbursement_vouchers')
        .update({
          status: 'processed',
          payment_date: format(data.payment_date, 'yyyy-MM-dd'),
          processed_at: new Date().toISOString(),
          processed_by: user.data.user?.id,
        })
        .eq('id', dv?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Disbursement voucher marked as paid',
      });
      queryClient.invalidateQueries({ queryKey: ['disbursement-vouchers'] });
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to mark as paid: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    markPaidMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark DV as Paid</DialogTitle>
          <DialogDescription>
            Enter the payment date to mark this disbursement voucher as processed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">DV Number</p>
              <p className="font-medium">{dv?.dv_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payee</p>
              <p className="font-medium">{dv?.payee_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-medium">₱{dv?.amount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">
                {dv?.payment_method?.replace('_', ' ')}
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={markPaidMutation.isPending}>
                  {markPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

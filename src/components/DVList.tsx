import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DisbursementVoucher = any;

export const DVList: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dvs, isLoading } = useQuery({
    queryKey: ['disbursement-vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disbursement_vouchers')
        .select(`
          *,
          inspection_reports (
            *,
            purchase_orders (*)
          ),
          created_by_profile:created_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DisbursementVoucher[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      
      if (status === 'processed') {
        updates.processed_at = new Date().toISOString();
        updates.processed_by = (await supabase.auth.getUser()).data.user?.id;
      }

      const { error } = await supabase
        .from('disbursement_vouchers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'DV status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['disbursement-vouchers'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'for_signature':
        return <Badge variant="outline">For Signature</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'processed':
        return <Badge variant="default">Processed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div>Loading disbursement vouchers...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DV Number</TableHead>
            <TableHead>IAR Number</TableHead>
            <TableHead>PO Number</TableHead>
            <TableHead>Payee</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dvs?.map((dv) => (
            <TableRow key={dv.id}>
              <TableCell className="font-medium">{dv.dv_number}</TableCell>
              <TableCell>{dv.inspection_reports.iar_number}</TableCell>
              <TableCell>{dv.inspection_reports.purchase_orders.po_number}</TableCell>
              <TableCell>{dv.payee_name}</TableCell>
              <TableCell>₱{dv.amount.toLocaleString()}</TableCell>
              <TableCell className="capitalize">
                {dv.payment_method?.replace('_', ' ')}
                {dv.check_number && ` (${dv.check_number})`}
              </TableCell>
              <TableCell>{getStatusBadge(dv.status || 'for_signature')}</TableCell>
              <TableCell>{dv.created_by_profile?.full_name}</TableCell>
              <TableCell>
                <Select
                  value={dv.status || 'for_signature'}
                  onValueChange={(status) => updateStatusMutation.mutate({ id: dv.id, status })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="for_signature">For Signature</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          )) || (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                No disbursement vouchers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
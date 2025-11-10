import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Pencil, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { MarkDVPaidDialog } from './MarkDVPaidDialog';
import { DVDetailDialog } from './DVDetailDialog';
import { EditDVDialog } from './EditDVDialog';

type DisbursementVoucher = any;

export const DVList: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDV, setSelectedDV] = useState<DisbursementVoucher | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);

  // Fetch user roles to check permissions
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.data.user?.id);
      return data?.map(r => r.role) || [];
    },
  });

  const isAccountantOrAdmin = userRoles?.some(
    r => r === 'accountant' || r === 'admin'
  );

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
          ),
          processed_by_profile:processed_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DisbursementVoucher[];
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
            <TableHead>Payment Date</TableHead>
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
              <TableCell>
                {dv.payment_date ? (
                  format(new Date(dv.payment_date), 'MMM dd, yyyy')
                ) : (
                  <span className="text-muted-foreground">Not yet paid</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(dv.status || 'for_signature')}</TableCell>
              <TableCell>{dv.created_by_profile?.full_name}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDV(dv);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {isAccountantOrAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDV(dv);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {dv.status === 'submitted' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedDV(dv);
                            setMarkPaidDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark as Paid
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )) || (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                No disbursement vouchers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DVDetailDialog
        dv={selectedDV}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEditClick={() => {
          setDetailDialogOpen(false);
          setEditDialogOpen(true);
        }}
        canEdit={isAccountantOrAdmin || false}
      />

      <EditDVDialog
        dv={selectedDV}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['disbursement-vouchers'] });
        }}
      />

      <MarkDVPaidDialog
        dv={selectedDV}
        open={markPaidDialogOpen}
        onOpenChange={setMarkPaidDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['disbursement-vouchers'] });
        }}
      />
    </div>
  );
};
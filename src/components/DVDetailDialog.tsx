import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface DVDetailDialogProps {
  dv: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick: () => void;
  canEdit: boolean;
}

export const DVDetailDialog: React.FC<DVDetailDialogProps> = ({
  dv,
  open,
  onOpenChange,
  onEditClick,
  canEdit,
}) => {
  if (!dv) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{dv.dv_number}</DialogTitle>
          <DialogDescription>
            Disbursement Voucher Details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Dates */}
          <div>
            <h3 className="font-semibold mb-3">Status Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(dv.status || 'for_signature')}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created Date</p>
                <p className="mt-1">{format(new Date(dv.created_at), 'PPP')}</p>
              </div>
              {dv.payment_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p className="mt-1">{format(new Date(dv.payment_date), 'PPP')}</p>
                </div>
              )}
              {dv.processed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Processed Date</p>
                  <p className="mt-1">{format(new Date(dv.processed_at), 'PPP')}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-3">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Payee Name</p>
                <p className="mt-1 font-medium">{dv.payee_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="mt-1 font-medium text-lg">₱{dv.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="mt-1 capitalize">{dv.payment_method?.replace('_', ' ')}</p>
              </div>
              {dv.check_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Check Number</p>
                  <p className="mt-1">{dv.check_number}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Related Documents */}
          <div>
            <h3 className="font-semibold mb-3">Related Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">IAR Number</p>
                <p className="mt-1 font-medium">
                  {dv.inspection_reports?.iar_number || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PO Number</p>
                <p className="mt-1 font-medium">
                  {dv.inspection_reports?.purchase_orders?.po_number || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Processing Information */}
          <div>
            <h3 className="font-semibold mb-3">Processing Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="mt-1">{dv.created_by_profile?.full_name || 'N/A'}</p>
              </div>
              {dv.processed_by_profile && (
                <div>
                  <p className="text-sm text-muted-foreground">Processed By</p>
                  <p className="mt-1">{dv.processed_by_profile.full_name}</p>
                </div>
              )}
            </div>
          </div>

          {dv.receipt_attachments && dv.receipt_attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Receipt Attachments</h3>
                <div className="space-y-2">
                  {dv.receipt_attachments.map((url: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Receipt {index + 1}</span>
                      <Button size="sm" variant="outline" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {canEdit && (
            <Button onClick={onEditClick}>
              Edit DV
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

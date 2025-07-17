import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, User, FileText, Package } from 'lucide-react';

interface IARItem {
  id: string;
  inspected_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  result: 'accepted' | 'rejected' | 'requires_reinspection';
  remarks: string | null;
  po_items: {
    quantity: number;
    unit_cost: number;
    pr_items: {
      item_name: string;
      unit: string;
      description: string;
    };
  };
}

interface InspectionReport {
  id: string;
  iar_number: string;
  inspection_date: string;
  overall_result: 'accepted' | 'rejected' | 'requires_reinspection';
  remarks: string | null;
  created_at: string;
  inspector: {
    full_name: string;
  };
  purchase_order: {
    po_number: string;
    supplier_name: string;
    total_amount: number;
  };
  iar_items?: IARItem[];
}

interface IARDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  iar: InspectionReport | null;
}

export const IARDetailDialog: React.FC<IARDetailDialogProps> = ({
  open,
  onOpenChange,
  iar,
}) => {
  if (!iar) return null;

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'requires_reinspection':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Requires Reinspection</Badge>;
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Inspection Report Details - {iar.iar_number}
          </DialogTitle>
          <DialogDescription>
            Complete details of the inspection report and all inspected items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">IAR Number:</span>
                <span>{iar.iar_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">PO Number:</span>
                <span>{iar.purchase_order.po_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Inspection Date:</span>
                <span>{formatDate(iar.inspection_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Inspector:</span>
                <span>{iar.inspector.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Overall Result:</span>
                {getResultBadge(iar.overall_result)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Supplier:</span>
                <span>{iar.purchase_order.supplier_name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-sm text-muted-foreground">PO Total Amount</span>
                  <p className="text-lg font-semibold">{formatCurrency(iar.purchase_order.total_amount)}</p>
                </div>
                <div>
                  <span className="font-medium text-sm text-muted-foreground">Supplier</span>
                  <p className="text-lg">{iar.purchase_order.supplier_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspection Items */}
          {iar.iar_items && iar.iar_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inspected Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Inspected Qty</TableHead>
                      <TableHead>Accepted Qty</TableHead>
                      <TableHead>Rejected Qty</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {iar.iar_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.po_items.pr_items.item_name}</div>
                            {item.po_items.pr_items.description && (
                              <div className="text-sm text-muted-foreground">
                                {item.po_items.pr_items.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.po_items.pr_items.unit}</TableCell>
                        <TableCell>{item.inspected_quantity}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {item.accepted_quantity}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {item.rejected_quantity}
                        </TableCell>
                        <TableCell>{getResultBadge(item.result)}</TableCell>
                        <TableCell>
                          {item.remarks ? (
                            <span className="text-sm">{item.remarks}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">No remarks</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Remarks */}
          {iar.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{iar.remarks}</p>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Created:</span>
                  <p>{formatDate(iar.created_at)}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">IAR ID:</span>
                  <p className="font-mono text-xs">{iar.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
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
import { Calendar, User, FileText, Package, Building, Phone, MapPin } from 'lucide-react';

interface POItem {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  delivered_quantity: number | null;
  remaining_quantity: number | null;
  pr_items: {
    item_name: string;
    description: string | null;
    unit: string;
    budget_category: string;
  };
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  supplier_address: string | null;
  supplier_contact: string | null;
  total_amount: number;
  status: 'pending' | 'approved' | 'cancelled';
  delivery_status: 'not_delivered' | 'partially_delivered' | 'fully_delivered';
  delivery_date: string | null;
  terms_conditions: string | null;
  created_at: string;
  approved_at: string | null;
  created_by_profile: {
    full_name: string;
  } | null;
  approved_by_profile: {
    full_name: string;
  } | null;
  po_items?: POItem[];
}

interface PODetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: PurchaseOrder | null;
}

export const PODetailDialog: React.FC<PODetailDialogProps> = ({
  open,
  onOpenChange,
  po,
}) => {
  if (!po) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'not_delivered':
        return <Badge variant="outline">Not Delivered</Badge>;
      case 'partially_delivered':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Partially Delivered</Badge>;
      case 'fully_delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">Fully Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Purchase Order Details - {po.po_number}
          </DialogTitle>
          <DialogDescription>
            Complete details of the purchase order including all items and supplier information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">PO Number:</span>
                <span>{po.po_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {getStatusBadge(po.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Delivery Status:</span>
                {getDeliveryStatusBadge(po.delivery_status)}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created:</span>
                <span>{formatDate(po.created_at)}</span>
              </div>
              {po.approved_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Approved:</span>
                  <span>{formatDate(po.approved_at)}</span>
                </div>
              )}
              {po.delivery_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Delivery Date:</span>
                  <span>{formatDate(po.delivery_date)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created By:</span>
                <span>{po.created_by_profile?.full_name || 'Unknown'}</span>
              </div>
              {po.approved_by_profile && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Approved By:</span>
                  <span>{po.approved_by_profile.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(po.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Supplier Name:</span>
                <span>{po.supplier_name}</span>
              </div>
              {po.supplier_contact && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Contact:</span>
                  <span>{po.supplier_contact}</span>
                </div>
              )}
              {po.supplier_address && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="text-sm text-muted-foreground mt-1">{po.supplier_address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Order Items */}
          {po.po_items && po.po_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.po_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.pr_items.item_name}
                        </TableCell>
                        <TableCell>
                          {item.pr_items.description ? (
                            <span className="text-sm text-muted-foreground">
                              {item.pr_items.description}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">No description</span>
                          )}
                        </TableCell>
                        <TableCell>{item.pr_items.unit}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.total_cost)}
                        </TableCell>
                        <TableCell>
                          {item.delivered_quantity !== null ? (
                            <span className="text-blue-600 font-medium">
                              {item.delivered_quantity}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.remaining_quantity !== null ? (
                            <span className="text-orange-600 font-medium">
                              {item.remaining_quantity}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{item.quantity}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.pr_items.budget_category}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
          {po.terms_conditions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Terms and Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {po.terms_conditions}
                </p>
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
                  <span className="font-medium text-muted-foreground">PO ID:</span>
                  <p className="font-mono text-xs">{po.id}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Total Items:</span>
                  <p>{po.po_items?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
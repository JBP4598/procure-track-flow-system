import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Edit, Truck, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  supplier_contact: string | null;
  total_amount: number;
  status: 'pending' | 'approved' | 'cancelled';
  delivery_status: 'not_delivered' | 'partially_delivered' | 'fully_delivered';
  delivery_date: string | null;
  created_at: string;
  created_by: string;
  profiles: {
    full_name: string;
  } | null;
}

interface POListProps {
  refreshTrigger: number;
}

export function POList({ refreshTrigger }: POListProps) {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          supplier_name,
          supplier_contact,
          total_amount,
          status,
          delivery_status,
          delivery_date,
          created_at,
          created_by,
          profiles!purchase_orders_created_by_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPOs(data || []);
    } catch (error) {
      console.error('Error fetching POs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [refreshTrigger]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDeliveryStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      not_delivered: 'bg-gray-100 text-gray-800',
      partially_delivered: 'bg-blue-100 text-blue-800',
      fully_delivered: 'bg-green-100 text-green-800',
    };

    const labels: Record<string, string> = {
      not_delivered: 'Not Delivered',
      partially_delivered: 'Partial',
      fully_delivered: 'Delivered',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const updatePOStatus = async (poId: string, status: 'pending' | 'approved' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', poId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Purchase order ${status}`,
      });

      fetchPOs();
    } catch (error) {
      console.error('Error updating PO status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update purchase order status',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>Loading purchase orders...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Purchase Orders
        </CardTitle>
        <CardDescription>
          Manage and track purchase orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No purchase orders found</p>
            <p className="text-sm">Purchase orders will appear here once created from approved PRs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">
                      {po.po_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{po.supplier_name}</div>
                        {po.supplier_contact && (
                          <div className="text-sm text-muted-foreground">
                            {po.supplier_contact}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(po.total_amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(po.status)}
                    </TableCell>
                    <TableCell>
                      {getDeliveryStatusBadge(po.delivery_status)}
                    </TableCell>
                    <TableCell>
                      {po.delivery_date 
                        ? format(new Date(po.delivery_date), 'MMM dd, yyyy')
                        : 'Not set'
                      }
                    </TableCell>
                    <TableCell>
                      {po.profiles?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(po.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {po.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updatePOStatus(po.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {po.status === 'approved' && po.delivery_status === 'not_delivered' && (
                          <Button variant="outline" size="sm">
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
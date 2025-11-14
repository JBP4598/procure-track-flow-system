import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, Edit, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateVarianceInfo, getExecutionStatusBadge } from '@/utils/ppmpVariance';

interface PPMPFile {
  id: string;
  file_name: string;
  fiscal_year: number;
  total_budget: number;
  status: string;
  created_at: string;
  version: number;
  ppmp_number?: string;
  status_type?: string;
  end_user_unit?: string;
  prepared_date?: string;
  submitted_date?: string;
  agency_letterhead_url?: string;
}

interface PPMPItem {
  id: string;
  item_name: string;
  description?: string;
  project_objective?: string;
  project_type?: string;
  project_size?: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  budget_category: string;
  recommended_procurement_mode?: string;
  pre_procurement_conference?: boolean;
  procurement_start_date?: string;
  procurement_end_date?: string;
  expected_delivery_period?: string;
  source_of_funds?: string;
  schedule_quarter?: string;
  remarks_additional?: string;
  remaining_quantity?: number;
  remaining_budget?: number;
  date_of_conduct?: string;
  venue?: string;
  program_coordinator_id?: string;
  pr_submitted_date?: string;
  pr_actual_amount?: number;
  po_number?: string;
  po_actual_amount?: number;
  winning_supplier?: string;
  dv_prepared_date?: string;
  dv_actual_amount?: number;
  execution_status?: 'planned' | 'pr_submitted' | 'po_issued' | 'completed';
}

interface PPMPDetailDialogProps {
  ppmpFile: PPMPFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PPMPDetailDialog: React.FC<PPMPDetailDialogProps> = ({
  ppmpFile,
  open,
  onOpenChange,
}) => {
  const [items, setItems] = useState<PPMPItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      if (!ppmpFile) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ppmp_items')
          .select('*')
          .eq('ppmp_file_id', ppmpFile.id)
          .order('created_at');

        if (error) throw error;
        setItems((data as any[])?.map(item => ({
          ...item,
          execution_status: (item.execution_status || 'planned') as PPMPItem['execution_status']
        })) || []);
      } catch (error) {
        console.error('Error fetching PPMP items:', error);
        toast({
          title: "Error",
          description: "Failed to load PPMP items",
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    if (open && ppmpFile) {
      fetchItems();
    }
  }, [open, ppmpFile, toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!ppmpFile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PPMP Details - {ppmpFile.file_name}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this Project Procurement Management Plan
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Procurement Items</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">PPMP Number</p>
                    <p className="font-medium">{ppmpFile.ppmp_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Title</p>
                    <p className="font-medium">{ppmpFile.file_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fiscal Year</p>
                    <p className="font-medium">{ppmpFile.fiscal_year}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status Type</p>
                    <p className="font-medium">{ppmpFile.status_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(ppmpFile.status)}>
                      {ppmpFile.status.charAt(0).toUpperCase() + ppmpFile.status.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Implementation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End User/Implementing Unit</p>
                    <p className="font-medium">{ppmpFile.end_user_unit || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prepared Date</p>
                    <p className="font-medium">{formatDate(ppmpFile.prepared_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submitted Date</p>
                    <p className="font-medium">{formatDate(ppmpFile.submitted_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Version</p>
                    <p className="font-medium">v{ppmpFile.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                    <p className="font-medium text-lg">{formatCurrency(ppmpFile.total_budget)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Procurement Items ({items.length})</h3>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No procurement items found for this PPMP.
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Planned Amount</TableHead>
                      <TableHead>Actual Amount</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Supplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const varianceInfo = calculateVarianceInfo(item);
                      const statusBadge = getExecutionStatusBadge(item.execution_status);
                      const actualAmount = item.dv_actual_amount || item.po_actual_amount || item.pr_actual_amount;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>{formatCurrency(item.total_cost)}</TableCell>
                          <TableCell>
                            {actualAmount ? formatCurrency(actualAmount) : '-'}
                          </TableCell>
                          <TableCell>
                            {actualAmount ? (
                              <span className={varianceInfo.color}>
                                {formatCurrency(Math.abs(varianceInfo.variance))}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.winning_supplier || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{items.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(ppmpFile.total_budget)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Cost per Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {items.length > 0 ? formatCurrency(ppmpFile.total_budget / items.length) : formatCurrency(0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Budget Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    items.reduce((acc, item) => {
                      acc[item.budget_category] = (acc[item.budget_category] || 0) + item.total_cost;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="font-medium">{category}</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Execution & Variance Summary</CardTitle>
                <CardDescription>Track actual spending vs planned budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Planned</p>
                    <p className="text-lg font-bold">{formatCurrency(ppmpFile.total_budget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Actual</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(
                        items.reduce((sum, item) => {
                          const actual = item.dv_actual_amount || item.po_actual_amount || item.pr_actual_amount || 0;
                          return sum + actual;
                        }, 0)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Variance</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(
                        items.reduce((sum, item) => {
                          return sum + calculateVarianceInfo(item).variance;
                        }, 0)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items with Data</p>
                    <p className="text-lg font-bold">
                      {items.filter(item => item.dv_actual_amount || item.po_actual_amount || item.pr_actual_amount).length} / {items.length}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold mb-2">Status Breakdown:</p>
                  {Object.entries(
                    items.reduce((acc, item) => {
                      const status = item.execution_status || 'planned';
                      acc[status] = (acc[status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => {
                    const badge = getExecutionStatusBadge(status as any);
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <span>{count} items</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit PPMP
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { CreatePODialog } from '@/components/CreatePODialog';
import { POList } from '@/components/POList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function PurchaseOrders() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalPOs: 0,
    pending: 0,
    approved: 0,
    totalAmount: 0,
  });
  const { user } = useAuth();

  const handlePOCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get all POs visible to the user
      const { data: pos, error: poError } = await supabase
        .from('purchase_orders')
        .select('status, total_amount');

      if (poError) throw poError;

      const totalPOs = pos?.length || 0;
      const pending = pos?.filter(po => po.status === 'pending')?.length || 0;
      const approved = pos?.filter(po => po.status === 'approved')?.length || 0;
      const totalAmount = pos?.reduce((sum, po) => sum + po.total_amount, 0) || 0;

      setStats({
        totalPOs,
        pending,
        approved,
        totalAmount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, refreshTrigger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1">Create and manage purchase orders from approved PRs</p>
          </div>
          <CreatePODialog onPOCreated={handlePOCreated} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPOs}</div>
              <p className="text-xs text-muted-foreground">All purchase orders</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Ready for delivery</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">All active POs</p>
            </CardContent>
          </Card>
        </div>

        {/* PO List */}
        <POList refreshTrigger={refreshTrigger} />
      </div>
    </Layout>
  );
}
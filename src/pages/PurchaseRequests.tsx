
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { CreatePRDialog } from '@/components/CreatePRDialog';
import { PRList } from '@/components/PRList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function PurchaseRequests() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalPRs: 0,
    pending: 0,
    approved: 0,
    totalAmount: 0,
  });
  const { user } = useAuth();

  const handlePRCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get all PRs for the department
      const { data: prs, error: prError } = await supabase
        .from('purchase_requests')
        .select('status, total_amount');

      if (prError) throw prError;

      const totalPRs = prs?.length || 0;
      const pending = prs?.filter(pr => pr.status === 'pending' || pr.status === 'for_approval')?.length || 0;
      const approved = prs?.filter(pr => pr.status === 'approved' || pr.status === 'awarded')?.length || 0;
      const totalAmount = prs?.reduce((sum, pr) => sum + pr.total_amount, 0) || 0;

      setStats({
        totalPRs,
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
            <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
            <p className="text-gray-600 mt-1">Create and manage purchase requests</p>
          </div>
          <CreatePRDialog onPRCreated={handlePRCreated} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PRs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPRs}</div>
              <p className="text-xs text-muted-foreground">All purchase requests</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Ready for procurement</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">All active PRs</p>
            </CardContent>
          </Card>
        </div>

        {/* PR List */}
        <PRList refreshTrigger={refreshTrigger} />
      </div>
    </Layout>
  );
}

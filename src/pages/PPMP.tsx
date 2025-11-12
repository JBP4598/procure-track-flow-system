
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus, FileText } from 'lucide-react';
import { CreatePPMPDialog } from '@/components/CreatePPMPDialog';
import { ImportPPMPDialog } from '@/components/ImportPPMPDialog';
import { PPMPList } from '@/components/PPMPList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function PPMP() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalPPMPs: 0,
    totalBudget: 0,
    totalItems: 0,
  });
  const { user } = useAuth();

  const handlePPMPCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get PPMP count and total budget
      const { data: ppmpData, error: ppmpError } = await supabase
        .from('ppmp_files')
        .select('total_budget');

      if (ppmpError) throw ppmpError;

      const totalPPMPs = ppmpData?.length || 0;
      const totalBudget = ppmpData?.reduce((sum, ppmp) => sum + ppmp.total_budget, 0) || 0;

      // Get total items count
      const { count: itemsCount, error: itemsError } = await supabase
        .from('ppmp_items')
        .select('*', { count: 'exact', head: true });

      if (itemsError) throw itemsError;

      setStats({
        totalPPMPs,
        totalBudget,
        totalItems: itemsCount || 0,
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
            <h1 className="text-3xl font-bold text-gray-900">Project Procurement Management Plan</h1>
            <p className="text-gray-600 mt-1">Manage your annual procurement plans</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload PPMP
            </Button>
            <CreatePPMPDialog onPPMPCreated={handlePPMPCreated} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PPMPs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPPMPs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPPMPs === 0 ? 'No PPMPs created yet' : 'Total procurement plans'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
              <p className="text-xs text-muted-foreground">Total planned budget</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">Procurement items</p>
            </CardContent>
          </Card>
        </div>

        {/* PPMP List */}
        <PPMPList refreshTrigger={refreshTrigger} />
      </div>

      {/* Import Dialog */}
      <ImportPPMPDialog 
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSuccess={handlePPMPCreated}
      />
    </Layout>
  );
}

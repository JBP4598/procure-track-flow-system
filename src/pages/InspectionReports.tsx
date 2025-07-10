import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { CreateIARDialog } from '@/components/CreateIARDialog';
import { IARList } from '@/components/IARList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function InspectionReports() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalIARs: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const { user } = useAuth();

  const handleIARCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get all inspection reports visible to the user
      const { data: iars, error: iarError } = await supabase
        .from('inspection_reports')
        .select('overall_result');

      if (iarError) throw iarError;

      const totalIARs = iars?.length || 0;
      const pending = iars?.filter(iar => iar.overall_result === 'requires_reinspection')?.length || 0;
      const accepted = iars?.filter(iar => iar.overall_result === 'accepted')?.length || 0;
      const rejected = iars?.filter(iar => iar.overall_result === 'rejected')?.length || 0;

      setStats({
        totalIARs,
        pending,
        accepted,
        rejected,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, refreshTrigger]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspection & Acceptance Reports</h1>
            <p className="text-gray-600 mt-1">Manage delivery inspections and acceptance of purchase orders</p>
          </div>
          <CreateIARDialog onIARCreated={handleIARCreated} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total IARs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIARs}</div>
              <p className="text-xs text-muted-foreground">All inspection reports</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Requires reinspection</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
              <p className="text-xs text-muted-foreground">Ready for payment</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Items not accepted</p>
            </CardContent>
          </Card>
        </div>

        {/* IAR List */}
        <IARList refreshTrigger={refreshTrigger} />
      </div>
    </Layout>
  );
}
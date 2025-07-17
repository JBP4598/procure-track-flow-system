
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { BudgetSummary } from '@/components/BudgetSummary';
import { RecentActivity } from '@/components/RecentActivity';
import { ProcurementFlowChart } from '@/components/ProcurementFlowChart';
import { DollarSign, FileText, ShoppingCart, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalBudget: number;
  activePRs: number;
  pendingPOs: number;
  completedIARs: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBudget: 0,
    activePRs: 0,
    pendingPOs: 0,
    completedIARs: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboardStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch PR stats
      const { data: prData } = await supabase
        .from('purchase_requests')
        .select('total_amount, status')
        .eq('department_id', (await supabase.from('profiles').select('department_id').eq('id', user.id).single()).data?.department_id);

      // Fetch PO stats
      const { data: poData } = await supabase
        .from('purchase_orders')
        .select('total_amount, status');

      // Fetch IAR stats
      const { data: iarData } = await supabase
        .from('inspection_reports')
        .select('overall_result');

      // Calculate stats
      const totalBudget = prData?.reduce((sum, pr) => sum + pr.total_amount, 0) || 0;
      const activePRs = prData?.filter(pr => pr.status === 'pending' || pr.status === 'for_approval').length || 0;
      const pendingPOs = poData?.filter(po => po.status === 'pending').length || 0;
      const completedIARs = iarData?.filter(iar => iar.overall_result === 'accepted').length || 0;

      setStats({
        totalBudget,
        activePRs,
        pendingPOs,
        completedIARs
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Budget"
            value={loading ? "Loading..." : formatCurrency(stats.totalBudget)}
            icon={DollarSign}
            color="green"
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            title="Active PRs"
            value={loading ? "Loading..." : stats.activePRs}
            icon={FileText}
            color="blue"
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            title="Pending POs"
            value={loading ? "Loading..." : stats.pendingPOs}
            icon={ShoppingCart}
            color="yellow"
            trend={{ value: -5, isPositive: false }}
          />
          <KPICard
            title="Completed IARs"
            value={loading ? "Loading..." : stats.completedIARs}
            icon={CheckCircle}
            color="purple"
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Budget Summary and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetSummary />
          <RecentActivity />
        </div>

        {/* Procurement Flow Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Procurement Process Flow</h2>
          <ProcurementFlowChart />
        </div>
      </div>
    </Layout>
  );
}

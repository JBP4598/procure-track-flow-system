
import React from 'react';
import { Layout } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { BudgetSummary } from '@/components/BudgetSummary';
import { RecentActivity } from '@/components/RecentActivity';
import { ProcurementFlowChart } from '@/components/ProcurementFlowChart';
import { DollarSign, FileText, ShoppingCart, CheckCircle } from 'lucide-react';

export default function Dashboard() {
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
            value="₱2.5M"
            icon={DollarSign}
            color="green"
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            title="Active PRs"
            value="24"
            icon={FileText}
            color="blue"
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            title="Pending POs"
            value="12"
            icon={ShoppingCart}
            color="yellow"
            trend={{ value: -5, isPositive: false }}
          />
          <KPICard
            title="Completed IARs"
            value="18"
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


import React from 'react';
import { Layout } from '../components/Layout';
import { KPICard } from '../components/KPICard';
import { ProcurementFlowChart } from '../components/ProcurementFlowChart';
import { BudgetSummary } from '../components/BudgetSummary';
import { RecentActivity } from '../components/RecentActivity';
import { 
  FileText, 
  Truck, 
  CheckCircle, 
  CreditCard, 
  TrendingUp,
  Calendar 
} from 'lucide-react';

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Procurement Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor and track your government procurement processes in real-time
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <KPICard
            title="PPMPs Uploaded"
            value={15}
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
            color="blue"
          />
          <KPICard
            title="Purchase Requests"
            value={42}
            icon={FileText}
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
          <KPICard
            title="Purchase Orders"
            value={28}
            icon={Truck}
            trend={{ value: 15, isPositive: true }}
            color="yellow"
          />
          <KPICard
            title="IARs Completed"
            value={18}
            icon={CheckCircle}
            trend={{ value: 22, isPositive: true }}
            color="purple"
          />
          <KPICard
            title="DVs Processed"
            value={12}
            icon={CreditCard}
            trend={{ value: 5, isPositive: false }}
            color="red"
          />
          <KPICard
            title="Budget Savings"
            value="₱400K"
            icon={TrendingUp}
            trend={{ value: 18, isPositive: true }}
            color="green"
          />
        </div>

        {/* Procurement Flow */}
        <div className="mb-8">
          <ProcurementFlowChart />
        </div>

        {/* Budget Summary and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetSummary />
          <RecentActivity />
        </div>

        {/* Additional Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Procurement Timeline</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. PR Processing Time</span>
                <span className="text-sm font-medium text-gray-900">3.2 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. PO Processing Time</span>
                <span className="text-sm font-medium text-gray-900">5.8 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. IAR Processing Time</span>
                <span className="text-sm font-medium text-gray-900">2.1 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. DV Processing Time</span>
                <span className="text-sm font-medium text-gray-900">4.3 days</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">PRs Within Budget</span>
                <span className="text-sm font-medium text-green-600">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">On-Time Deliveries</span>
                <span className="text-sm font-medium text-green-600">87%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Inspections</span>
                <span className="text-sm font-medium text-blue-600">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Processed Payments</span>
                <span className="text-sm font-medium text-blue-600">89%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BudgetData {
  totalAllocated: number;
  totalObligated: number;
  totalDisbursed: number;
  totalSavings: number;
}

export const BudgetSummary: React.FC = () => {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalAllocated: 0,
    totalObligated: 0,
    totalDisbursed: 0,
    totalSavings: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBudgetData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get user's department
      const { data: profile } = await supabase
        .from('profiles')
        .select('department_id')
        .eq('id', user.id)
        .single();

      if (!profile?.department_id) return;

      // Fetch PPMP data for allocated budget
      const { data: ppmpData } = await supabase
        .from('ppmp_files')
        .select('total_budget')
        .eq('department_id', profile.department_id);

      // Fetch PR data for obligated amounts
      const { data: prData } = await supabase
        .from('purchase_requests')
        .select('total_amount, status')
        .eq('department_id', profile.department_id);

      // Fetch DV data for disbursed amounts
      const { data: dvData } = await supabase
        .from('disbursement_vouchers')
        .select('amount, status');

      // Calculate budget data
      const totalAllocated = ppmpData?.reduce((sum, ppmp) => sum + ppmp.total_budget, 0) || 0;
      const totalObligated = prData?.filter(pr => pr.status === 'approved').reduce((sum, pr) => sum + pr.total_amount, 0) || 0;
      const totalDisbursed = dvData?.filter(dv => dv.status === 'processed').reduce((sum, dv) => sum + dv.amount, 0) || 0;
      const totalSavings = totalAllocated - totalObligated;

      setBudgetData({
        totalAllocated,
        totalObligated,
        totalDisbursed,
        totalSavings,
      });
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [user]);

  const budgetItems = [
    { label: 'Total Allocated', amount: budgetData.totalAllocated, color: 'text-blue-600' },
    { label: 'Total Obligated', amount: budgetData.totalObligated, color: 'text-yellow-600' },
    { label: 'Total Disbursed', amount: budgetData.totalDisbursed, color: 'text-green-600' },
    { label: 'Total Savings', amount: budgetData.totalSavings, color: 'text-purple-600' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Budget Overview</h3>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {budgetItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              <span className={`text-lg font-bold ${item.color}`}>
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Remaining Balance</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(budgetData.totalAllocated - budgetData.totalDisbursed)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
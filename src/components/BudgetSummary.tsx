import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

export const BudgetSummary: React.FC = () => {
  const budgetData = [
    { label: 'Total Allocated', amount: 5000000, color: 'text-blue-600' },
    { label: 'Total Obligated', amount: 3200000, color: 'text-yellow-600' },
    { label: 'Total Disbursed', amount: 2800000, color: 'text-green-600' },
    { label: 'Total Savings', amount: 400000, color: 'text-purple-600' },
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
      <div className="space-y-4">
        {budgetData.map((item, index) => (
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
              {formatCurrency(1800000)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
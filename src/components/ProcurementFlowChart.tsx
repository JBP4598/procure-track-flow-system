
import React from 'react';
import { ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface FlowStepProps {
  title: string;
  status: 'completed' | 'active' | 'pending';
  count: number;
  isLast?: boolean;
}

const FlowStep: React.FC<FlowStepProps> = ({ title, status, count, isLast }) => {
  const statusColors = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const statusIcons = {
    completed: CheckCircle,
    active: Clock,
    pending: AlertCircle,
  };

  const StatusIcon = statusIcons[status];

  return (
    <div className="flex items-center">
      <div className={`px-4 py-3 rounded-lg border ${statusColors[status]} flex items-center space-x-2`}>
        <StatusIcon className="h-4 w-4" />
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs">{count} items</p>
        </div>
      </div>
      {!isLast && <ArrowRight className="h-5 w-5 text-gray-400 mx-2" />}
    </div>
  );
};

export const ProcurementFlowChart: React.FC = () => {
  const flowSteps = [
    { title: 'PPMP', status: 'completed' as const, count: 15 },
    { title: 'PR', status: 'active' as const, count: 12 },
    { title: 'PO', status: 'active' as const, count: 8 },
    { title: 'IAR', status: 'pending' as const, count: 3 },
    { title: 'DV', status: 'pending' as const, count: 1 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Procurement Flow Progress</h3>
      <div className="flex items-center justify-between overflow-x-auto">
        {flowSteps.map((step, index) => (
          <FlowStep
            key={step.title}
            title={step.title}
            status={step.status}
            count={step.count}
            isLast={index === flowSteps.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

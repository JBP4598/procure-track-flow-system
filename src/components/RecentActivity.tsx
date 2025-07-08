import React from 'react';
import { Clock, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'pr' | 'po' | 'iar' | 'dv';
  title: string;
  user: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

export const RecentActivity: React.FC = () => {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'pr',
      title: 'PR-2024-001 submitted for approval',
      user: 'John Doe',
      timestamp: '2 hours ago',
      status: 'info'
    },
    {
      id: '2',
      type: 'po',
      title: 'PO-2024-015 approved and sent to supplier',
      user: 'Jane Smith',
      timestamp: '4 hours ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'iar',
      title: 'IAR-2024-008 requires re-inspection',
      user: 'Mike Johnson',
      timestamp: '6 hours ago',
      status: 'warning'
    },
    {
      id: '4',
      type: 'dv',
      title: 'DV-2024-003 processed for payment',
      user: 'Sarah Wilson',
      timestamp: '8 hours ago',
      status: 'success'
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(activity.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <User className="h-3 w-3 mr-1" />
                <span className="mr-2">{activity.user}</span>
                <Clock className="h-3 w-3 mr-1" />
                <span>{activity.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
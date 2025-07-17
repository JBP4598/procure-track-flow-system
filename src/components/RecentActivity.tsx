import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ActivityItem {
  id: string;
  type: 'pr' | 'po' | 'iar' | 'dv';
  title: string;
  user: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
  created_at: string;
}

export const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRecentActivity = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const recentActivities: ActivityItem[] = [];

      // Get user's department
      const { data: profile } = await supabase
        .from('profiles')
        .select('department_id')
        .eq('id', user.id)
        .single();

      if (!profile?.department_id) return;

      // Fetch recent PRs
      const { data: prData } = await supabase
        .from('purchase_requests')
        .select(`
          id, pr_number, status, created_at,
          requester:profiles!purchase_requests_requested_by_fkey (full_name)
        `)
        .eq('department_id', profile.department_id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent POs
      const { data: poData } = await supabase
        .from('purchase_orders')
        .select(`
          id, po_number, status, created_at,
          creator:profiles!purchase_orders_created_by_fkey (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent IARs
      const { data: iarData } = await supabase
        .from('inspection_reports')
        .select(`
          id, iar_number, overall_result, created_at,
          inspector:profiles!inspection_reports_inspector_id_fkey (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent DVs
      const { data: dvData } = await supabase
        .from('disbursement_vouchers')
        .select(`
          id, dv_number, status, created_at,
          creator:profiles!disbursement_vouchers_created_by_fkey (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      // Process PR activities
      prData?.forEach(pr => {
        recentActivities.push({
          id: `pr-${pr.id}`,
          type: 'pr',
          title: `${pr.pr_number} ${pr.status === 'pending' ? 'submitted for approval' : pr.status}`,
          user: pr.requester?.full_name || 'Unknown',
          timestamp: getRelativeTime(pr.created_at),
          status: pr.status === 'approved' ? 'success' : 'info',
          created_at: pr.created_at
        });
      });

      // Process PO activities
      poData?.forEach(po => {
        recentActivities.push({
          id: `po-${po.id}`,
          type: 'po',
          title: `${po.po_number} ${po.status === 'approved' ? 'approved and sent to supplier' : po.status}`,
          user: po.creator?.full_name || 'Unknown',
          timestamp: getRelativeTime(po.created_at),
          status: po.status === 'approved' ? 'success' : 'info',
          created_at: po.created_at
        });
      });

      // Process IAR activities
      iarData?.forEach(iar => {
        recentActivities.push({
          id: `iar-${iar.id}`,
          type: 'iar',
          title: `${iar.iar_number} ${iar.overall_result === 'requires_reinspection' ? 'requires re-inspection' : iar.overall_result}`,
          user: iar.inspector?.full_name || 'Unknown',
          timestamp: getRelativeTime(iar.created_at),
          status: iar.overall_result === 'accepted' ? 'success' : iar.overall_result === 'requires_reinspection' ? 'warning' : 'info',
          created_at: iar.created_at
        });
      });

      // Process DV activities
      dvData?.forEach(dv => {
        recentActivities.push({
          id: `dv-${dv.id}`,
          type: 'dv',
          title: `${dv.dv_number} ${dv.status === 'processed' ? 'processed for payment' : dv.status}`,
          user: dv.creator?.full_name || 'Unknown',
          timestamp: getRelativeTime(dv.created_at),
          status: dv.status === 'processed' ? 'success' : 'info',
          created_at: dv.created_at
        });
      });

      // Sort by created_at and take the most recent 6
      recentActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(recentActivities.slice(0, 6));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, [user]);

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
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};
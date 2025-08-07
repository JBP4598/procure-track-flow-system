import React from 'react';
import { Badge } from '@/components/ui/badge';

export type BadgeStatus = 'pending' | 'approved' | 'rejected' | 'for_signature' | 'paid' | 'cancelled' | 'draft' | 'published' | 'delivered' | 'not_delivered' | 'partially_delivered';

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: BadgeStatus) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' };
      case 'approved':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' };
      case 'for_signature':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'For Signature' };
      case 'paid':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Paid' };
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' };
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Draft' };
      case 'published':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Published' };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Delivered' };
      case 'not_delivered':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Not Delivered' };
      case 'partially_delivered':
        return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Partially Delivered' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className}`}
    >
      {config.label}
    </Badge>
  );
};
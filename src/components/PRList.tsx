import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, Calendar, User, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface PurchaseRequest {
  id: string;
  pr_number: string;
  purpose: string;
  total_amount: number;
  status: string;
  created_at: string;
  requested_by: string;
  ppmp_file_id?: string;
  profiles: {
    full_name: string;
  };
  ppmp_files?: {
    file_name: string;
  };
}

interface PRListProps {
  refreshTrigger: number;
}

export const PRList: React.FC<PRListProps> = ({ refreshTrigger }) => {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchPurchaseRequests();
  }, [user, refreshTrigger]);

  const fetchPurchaseRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          id,
          pr_number,
          purpose,
          total_amount,
          status,
          created_at,
          requested_by,
          ppmp_file_id,
          profiles!purchase_requests_requested_by_fkey (
            full_name
          ),
          ppmp_files (
            file_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseRequests(data || []);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'for_approval':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'awarded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'returned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'for_approval':
        return 'For Approval';
      case 'approved':
        return 'Approved';
      case 'awarded':
        return 'Awarded';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  const filteredRequests = purchaseRequests.filter(pr => {
    const matchesSearch = pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pr.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Requests</CardTitle>
        <CardDescription>
          Manage your department's purchase requests
        </CardDescription>
        
        {/* Filters */}
        <div className="flex gap-4 pt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PR number or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="for_approval">For Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || statusFilter !== 'all' ? 'No matching requests' : 'No Purchase Requests'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by creating your first purchase request.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((pr) => (
              <Card key={pr.id} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{pr.pr_number}</h4>
                        <Badge className={getStatusColor(pr.status)}>
                          {getStatusLabel(pr.status)}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {pr.purpose}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Requested by:</span>
                          <span className="font-medium">{pr.profiles.full_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">
                            {format(new Date(pr.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-semibold text-foreground">
                            ₱{pr.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      
                      {pr.ppmp_files && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Related PPMP:</span>
                          <span className="ml-2 font-medium">{pr.ppmp_files.file_name}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Edit, Download, Calendar, Users, DollarSign, Send, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PPMPDetailDialog } from '@/components/PPMPDetailDialog';
import { PPMPEditDialog } from '@/components/PPMPEditDialog';
import { toast } from '@/hooks/use-toast';

interface PPMPFile {
  id: string;
  file_name: string;
  fiscal_year: number;
  total_budget: number;
  status: string;
  created_at: string;
  version: number;
  ppmp_number?: string;
  status_type?: string;
  end_user_unit?: string;
  prepared_date?: string;
  submitted_date?: string;
}

interface PPMPListProps {
  refreshTrigger: number;
}

export const PPMPList: React.FC<PPMPListProps> = ({ refreshTrigger }) => {
  const [PPMPFiles, setPPMPFiles] = useState<PPMPFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPPMP, setSelectedPPMP] = useState<PPMPFile | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusRemarks, setStatusRemarks] = useState('');
  const { user } = useAuth();

  const fetchPPMPs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ppmp_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPPMPFiles(data || []);
    } catch (error) {
      console.error('Error fetching PPMPs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPPMPs();
      fetchUserRole();
    }
  }, [user, refreshTrigger]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewPPMP = (ppmp: PPMPFile) => {
    setSelectedPPMP(ppmp);
    setDetailDialogOpen(true);
  };

  const handleEditPPMP = (ppmp: PPMPFile) => {
    if (ppmp.status !== 'draft') {
      toast({
        title: "Cannot Edit PPMP",
        description: `PPMPs with status "${ppmp.status}" cannot be edited. Only draft PPMPs can be modified.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPPMP(ppmp);
    setEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    setSelectedPPMP(null);
    fetchPPMPs();
  };

  const handleStatusUpdate = async (ppmpId: string, newStatus: string, remarks?: string) => {
    try {
      const updateData: any = { 
        status: newStatus
      };

      if (newStatus === 'submitted') {
        updateData.submitted_date = new Date().toISOString().split('T')[0];
        updateData.submitted_by = user?.id;
      }

      if (remarks) {
        updateData.remarks = remarks;
      }

      const { error } = await supabase
        .from('ppmp_files')
        .update(updateData)
        .eq('id', ppmpId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `PPMP has been ${newStatus}.`,
      });

      fetchPPMPs();
      setStatusRemarks('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update PPMP status.",
        variant: "destructive",
      });
    }
  };

  const canSubmit = (status: string) => {
    return status === 'draft';
  };

  const canApprove = (status: string) => {
    return (userRole === 'admin' || userRole === 'bac') && status === 'submitted';
  };

  const canReject = (status: string) => {
    return (userRole === 'admin' || userRole === 'bac') && status === 'submitted';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading PPMPs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (PPMPFiles.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No PPMPs found</h3>
            <p className="text-muted-foreground">
              Get started by creating your first Project Procurement Management Plan.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4">
          {PPMPFiles.map((PPMPFile) => (
            <Card key={PPMPFile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{PPMPFile.file_name}</h3>
                      <Badge className={getStatusColor(PPMPFile.status)}>
                        {PPMPFile.status.charAt(0).toUpperCase() + PPMPFile.status.slice(1)}
                      </Badge>
                      {PPMPFile.status_type && (
                        <Badge variant="outline">
                          {PPMPFile.status_type}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>FY {PPMPFile.fiscal_year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(PPMPFile.total_budget)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{PPMPFile.end_user_unit || 'N/A'}</span>
                      </div>
                      <div>
                        <span>Created: {formatDate(PPMPFile.created_at)}</span>
                      </div>
                    </div>

                    {PPMPFile.ppmp_number && (
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">PPMP No:</span> {PPMPFile.ppmp_number}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPPMP(PPMPFile)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditPPMP(PPMPFile)}
                      disabled={PPMPFile.status !== 'draft'}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {canSubmit(PPMPFile.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="default" size="sm">
                            <Send className="h-4 w-4 mr-1" />
                            Submit for Approval
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Submit PPMP for Approval</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to submit this PPMP for approval? Once submitted, you won't be able to edit it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleStatusUpdate(PPMPFile.id, 'submitted')}>
                              Submit
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {canApprove(PPMPFile.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="default" size="sm">
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Approve PPMP</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to approve this PPMP?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Remarks (Optional)</label>
                            <Textarea
                              placeholder="Add approval remarks..."
                              value={statusRemarks}
                              onChange={(e) => setStatusRemarks(e.target.value)}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setStatusRemarks('')}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleStatusUpdate(PPMPFile.id, 'approved', statusRemarks)}>
                              Approve
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {canReject(PPMPFile.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject PPMP</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to reject this PPMP?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rejection Reason</label>
                            <Textarea
                              placeholder="Please provide a reason for rejection..."
                              value={statusRemarks}
                              onChange={(e) => setStatusRemarks(e.target.value)}
                              required
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setStatusRemarks('')}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleStatusUpdate(PPMPFile.id, 'rejected', statusRemarks)}
                              disabled={!statusRemarks.trim()}
                            >
                              Reject
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t">
                  <span>Version {PPMPFile.version}</span>
                  <span>Last updated: {formatDate(PPMPFile.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <PPMPDetailDialog
        ppmpFile={selectedPPMP}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      <PPMPEditDialog
        ppmpFile={selectedPPMP}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onComplete={handleEditComplete}
      />
    </>
  );
};
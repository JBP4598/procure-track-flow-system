import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, FileText, Calendar, User, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { IARDetailDialog } from './IARDetailDialog';
import { EditIARDialog } from './EditIARDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InspectionReport {
  id: string;
  iar_number: string;
  inspection_date: string;
  overall_result: 'accepted' | 'rejected' | 'requires_reinspection';
  remarks: string | null;
  created_at: string;
  is_emergency_purchase?: boolean;
  emergency_supplier_name?: string;
  emergency_amount?: number;
  emergency_reference?: string;
  inspector: {
    full_name: string;
  };
  purchase_order: {
    po_number: string;
    supplier_name: string;
    total_amount: number;
  } | null;
}

interface IARListProps {
  refreshTrigger: number;
}

export const IARList: React.FC<IARListProps> = ({ refreshTrigger }) => {
  const [iars, setIARs] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIAR, setSelectedIAR] = useState<InspectionReport | null>(null);
  const [editingIAR, setEditingIAR] = useState<InspectionReport | null>(null);
  const [deletingIAR, setDeletingIAR] = useState<InspectionReport | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchIARs();
    checkAdminStatus();
  }, [user, refreshTrigger]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchIARs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inspection_reports')
        .select(`
          id,
          iar_number,
          inspection_date,
          overall_result,
          remarks,
          created_at,
          is_emergency_purchase,
          emergency_supplier_name,
          emergency_amount,
          emergency_reference,
          inspector:profiles!inspection_reports_inspector_id_fkey (
            full_name
          ),
          purchase_order:purchase_orders (
            po_number,
            supplier_name,
            total_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIARs(data || []);
    } catch (error) {
      console.error('Error fetching IARs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inspection reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredIARs = iars.filter(iar =>
    iar.iar_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (iar.purchase_order?.po_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (iar.purchase_order?.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (iar.emergency_supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    iar.inspector.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'requires_reinspection':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Requires Reinspection</Badge>;
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!deletingIAR) return;

    try {
      // Delete IAR items first (if any)
      const { error: itemsError } = await supabase
        .from('iar_items')
        .delete()
        .eq('iar_id', deletingIAR.id);

      if (itemsError) throw itemsError;

      // Delete the IAR
      const { error: iarError } = await supabase
        .from('inspection_reports')
        .delete()
        .eq('id', deletingIAR.id);

      if (iarError) throw iarError;

      toast({
        title: "Success",
        description: "Inspection report deleted successfully.",
      });

      setDeletingIAR(null);
      fetchIARs();
    } catch (error) {
      console.error('Error deleting IAR:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspection report.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inspection reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Inspection Reports</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by IAR #, PO #, supplier, or inspector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIARs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inspection reports found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first inspection report to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIARs.map((iar) => (
                <Card key={iar.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {iar.iar_number}
                            </h3>
                            {getResultBadge(iar.overall_result)}
                            {iar.is_emergency_purchase && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                Emergency Purchase
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() => setSelectedIAR(iar)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => setEditingIAR(iar)}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => setDeletingIAR(iar)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          {iar.is_emergency_purchase ? (
                            <>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>Ref: {iar.emergency_reference}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Inspected: {formatDate(iar.inspection_date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Inspector: {iar.inspector.full_name}</span>
                              </div>
                              <div>
                                <span className="font-medium">Supplier:</span> {iar.emergency_supplier_name}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>PO: {iar.purchase_order?.po_number}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Inspected: {formatDate(iar.inspection_date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Inspector: {iar.inspector.full_name}</span>
                              </div>
                              <div>
                                <span className="font-medium">Supplier:</span> {iar.purchase_order?.supplier_name}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-3">
                          <span className="font-medium text-sm">
                            {iar.is_emergency_purchase ? 'Purchase Amount:' : 'PO Amount:'}
                          </span>{' '}
                          <span className="text-sm">
                            {formatCurrency(iar.is_emergency_purchase ? iar.emergency_amount || 0 : iar.purchase_order?.total_amount || 0)}
                          </span>
                        </div>

                        {iar.remarks && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Remarks:</span> {iar.remarks}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Created: {formatDate(iar.created_at)}</span>
                        <span>IAR ID: {iar.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <IARDetailDialog
        open={!!selectedIAR}
        onOpenChange={(open) => !open && setSelectedIAR(null)}
        iar={selectedIAR}
      />

      <EditIARDialog
        open={!!editingIAR}
        onOpenChange={(open) => !open && setEditingIAR(null)}
        iar={editingIAR}
        onIARUpdated={fetchIARs}
      />

      <AlertDialog open={!!deletingIAR} onOpenChange={(open) => !open && setDeletingIAR(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the inspection report <strong>{deletingIAR?.iar_number}</strong> and all its items.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
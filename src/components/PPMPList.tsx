import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Download, Calendar, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PPMPDetailDialog } from '@/components/PPMPDetailDialog';

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
    fetchPPMPs();
  }, [user, refreshTrigger]);

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
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
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
    </>
  );
};
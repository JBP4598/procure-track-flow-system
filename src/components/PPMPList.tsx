import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, DollarSign, Eye, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PPMPFile {
  id: string;
  file_name: string;
  fiscal_year: number;
  total_budget: number;
  status: string;
  created_at: string;
  version: number;
}

interface PPMPListProps {
  refreshTrigger: number;
}

export const PPMPList: React.FC<PPMPListProps> = ({ refreshTrigger }) => {
  const [ppmpFiles, setPpmpFiles] = useState<PPMPFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPPMPs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ppmp_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPpmpFiles(data || []);
    } catch (error) {
      console.error('Error fetching PPMPs:', error);
      toast({
        title: "Error",
        description: "Failed to load PPMPs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPPMPs();
  }, [user, refreshTrigger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PPMP Files</CardTitle>
          <CardDescription>Loading your procurement plans...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading PPMPs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ppmpFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PPMP Files</CardTitle>
          <CardDescription>
            Your Project Procurement Management Plans for different fiscal years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No PPMPs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new PPMP for your department.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PPMP Files</CardTitle>
        <CardDescription>
          Your Project Procurement Management Plans for different fiscal years
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ppmpFiles.map((ppmp) => (
            <div
              key={ppmp.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{ppmp.file_name}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      FY {ppmp.fiscal_year}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatCurrency(ppmp.total_budget)}
                    </div>
                    <Badge className={getStatusColor(ppmp.status)}>
                      {ppmp.status}
                    </Badge>
                    <span>v{ppmp.version}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(ppmp.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
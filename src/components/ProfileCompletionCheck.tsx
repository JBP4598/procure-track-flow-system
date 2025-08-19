import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DepartmentSelect } from '@/components/DepartmentSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface ProfileCompletionCheckProps {
  children: React.ReactNode;
}

export const ProfileCompletionCheck = ({ children }: ProfileCompletionCheckProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsCompletion, setNeedsCompletion] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('department_id, role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Check if department is missing
        setNeedsCompletion(!data.department_id);
      } catch (error) {
        console.error('Error checking profile:', error);
        setError('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!selectedDepartment) {
      setError('Please select a department');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ department_id: selectedDepartment })
        .eq('id', user?.id);

      if (error) throw error;

      setNeedsCompletion(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (needsCompletion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Please select your department to continue using the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DepartmentSelect
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                required
                disabled={updating}
              />
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleUpdateProfile}
                disabled={updating || !selectedDepartment}
                className="w-full"
              >
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Contact your administrator if you're unsure about your department assignment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
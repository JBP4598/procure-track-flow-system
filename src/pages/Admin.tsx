import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Users, AlertCircle } from 'lucide-react';
import { DepartmentSelect } from '@/components/DepartmentSelect';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'encoder' | 'inspector' | 'bac' | 'accountant';
  department_id: string | null;
  created_at: string;
  departments: { name: string; code: string } | null;
}

const ROLE_OPTIONS = [
  { value: 'encoder', label: 'Encoder' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'bac', label: 'BAC Member' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'admin', label: 'Administrator' }
];

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsAdmin(data.role === 'admin');
      } catch (error) {
        console.error('Error checking admin access:', error);
        setError('Failed to verify admin access');
      }
    };

    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id, email, full_name, role, department_id, created_at,
            departments:department_id (name, code)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers((data || []).map(user => ({
          ...user,
          role: user.role as 'admin' | 'encoder' | 'inspector' | 'bac' | 'accountant'
        })));
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    setError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as 'admin' | 'encoder' | 'inspector' | 'bac' | 'accountant' })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as 'admin' | 'encoder' | 'inspector' | 'bac' | 'accountant' } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  const updateUserDepartment = async (userId: string, departmentId: string) => {
    setUpdating(userId);
    setError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ department_id: departmentId })
        .eq('id', userId);

      if (error) throw error;

      // Fetch updated department info
      const { data: deptData } = await supabase
        .from('departments')
        .select('name, code')
        .eq('id', departmentId)
        .single();

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, department_id: departmentId, departments: deptData }
          : user
      ));
    } catch (error) {
      console.error('Error updating user department:', error);
      setError('Failed to update user department');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'bac': return 'default';
      case 'accountant': return 'secondary';
      case 'inspector': return 'outline';
      default: return 'outline';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please sign in to access this page.</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>You do not have permission to access this page.</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage user roles and department assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userProfile) => (
                      <TableRow key={userProfile.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{userProfile.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {userProfile.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-48">
                            <DepartmentSelect
                              value={userProfile.department_id || ''}
                              onValueChange={(value) => updateUserDepartment(userProfile.id, value)}
                              disabled={updating === userProfile.id}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <Select
                              value={userProfile.role}
                              onValueChange={(value) => updateUserRole(userProfile.id, value)}
                              disabled={updating === userProfile.id}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(userProfile.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {updating === userProfile.id && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
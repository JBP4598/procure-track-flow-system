import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface DepartmentSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export const DepartmentSelect = ({ value, onValueChange, required, disabled }: DepartmentSelectProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name, code')
          .order('name');

        if (error) throw error;
        setDepartments(data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleValueChange = (newValue: string) => {
    console.log('Department selected:', newValue);
    onValueChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="department">Department {required && <span className="text-red-500">*</span>}</Label>
      <Select value={value} onValueChange={handleValueChange} disabled={disabled || loading}>
        <SelectTrigger id="department">
          <SelectValue placeholder={loading ? "Loading departments..." : "Select your department"} />
        </SelectTrigger>
        <SelectContent position="popper">
          {departments.length === 0 && !loading ? (
            <div className="px-8 py-2 text-sm text-muted-foreground">No departments available</div>
          ) : (
            departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
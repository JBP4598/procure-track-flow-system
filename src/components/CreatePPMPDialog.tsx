import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';

interface CreatePPMPDialogProps {
  onPPMPCreated: () => void;
}

export const CreatePPMPDialog: React.FC<CreatePPMPDialogProps> = ({ onPPMPCreated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fileName: '',
    fiscalYear: new Date().getFullYear(),
    totalBudget: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get user's department
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('department_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.department_id) {
        toast({
          title: "Error",
          description: "You must be assigned to a department to create PPMPs.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from('ppmp_files').insert({
        file_name: formData.fileName,
        fiscal_year: formData.fiscalYear,
        total_budget: parseFloat(formData.totalBudget) || 0,
        department_id: profile.department_id,
        uploaded_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "PPMP created successfully!",
      });

      setFormData({
        fileName: '',
        fiscalYear: new Date().getFullYear(),
        totalBudget: '',
      });
      setOpen(false);
      onPPMPCreated();
    } catch (error) {
      console.error('Error creating PPMP:', error);
      toast({
        title: "Error",
        description: "Failed to create PPMP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New PPMP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New PPMP</DialogTitle>
          <DialogDescription>
            Create a new Project Procurement Management Plan for your department.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={formData.fileName}
                onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                placeholder="e.g., PPMP 2024 - IT Department"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fiscalYear">Fiscal Year</Label>
              <Select
                value={formData.fiscalYear.toString()}
                onValueChange={(value) => setFormData({ ...formData, fiscalYear: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fiscal year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="totalBudget">Total Budget (₱)</Label>
              <Input
                id="totalBudget"
                type="number"
                value={formData.totalBudget}
                onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create PPMP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
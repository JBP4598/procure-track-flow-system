import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';
import { PRItemsForm } from './PRItemsForm';

interface CreatePRDialogProps {
  onPRCreated: () => void;
}

interface PRItem {
  id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  budget_category: string;
  ppmp_item_id?: string;
  remarks?: string;
}

interface PPMPFile {
  id: string;
  file_name: string;
  fiscal_year: number;
}

export const CreatePRDialog: React.FC<CreatePRDialogProps> = ({ onPRCreated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PRItem[]>([]);
  const [ppmpFiles, setPpmpFiles] = useState<PPMPFile[]>([]);
  const [formData, setFormData] = useState({
    purpose: '',
    remarks: '',
    ppmp_file_id: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchPPMPFiles();
    }
  }, [open, user]);

  const fetchPPMPFiles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ppmp_files')
        .select('id, file_name, fiscal_year')
        .order('fiscal_year', { ascending: false });

      if (error) throw error;
      setPpmpFiles(data || []);
    } catch (error) {
      console.error('Error fetching PPMP files:', error);
    }
  };

  const generatePRNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    return `PR-${year}${month}${day}-${time}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the purchase request.",
        variant: "destructive",
      });
      return;
    }

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
          description: "You must be assigned to a department to create purchase requests.",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = items.reduce((sum, item) => sum + item.total_cost, 0);
      const prNumber = generatePRNumber();

      // Create the purchase request
      const { data: prData, error: prError } = await supabase
        .from('purchase_requests')
        .insert({
          pr_number: prNumber,
          purpose: formData.purpose,
          remarks: formData.remarks || null,
          total_amount: totalAmount,
          department_id: profile.department_id,
          requested_by: user.id,
          ppmp_file_id: formData.ppmp_file_id || null,
        })
        .select()
        .single();

      if (prError) throw prError;

      // Create the PR items
      const prItems = items.map(item => ({
        pr_id: prData.id,
        item_name: item.item_name,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
        budget_category: item.budget_category,
        ppmp_item_id: item.ppmp_item_id || null,
        remarks: item.remarks || null,
      }));

      const { error: itemsError } = await supabase
        .from('pr_items')
        .insert(prItems);

      if (itemsError) throw itemsError;

      // Update PPMP item quantities if linked
      for (const item of items) {
        if (item.ppmp_item_id) {
          const { error: updateError } = await supabase
            .from('ppmp_items')
            .update({
              remaining_quantity: item.quantity,
              remaining_budget: item.total_cost,
            })
            .eq('id', item.ppmp_item_id);

          if (updateError) {
            console.error('Error updating PPMP item:', updateError);
          }
        }
      }

      toast({
        title: "Success",
        description: `Purchase request ${prNumber} created successfully!`,
      });

      // Reset form
      setFormData({
        purpose: '',
        remarks: '',
        ppmp_file_id: '',
      });
      setItems([]);
      setOpen(false);
      onPRCreated();
    } catch (error) {
      console.error('Error creating purchase request:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New PR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Purchase Request</DialogTitle>
          <DialogDescription>
            Create a purchase request for your department's procurement needs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Describe the purpose of this purchase request"
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ppmpFile">Related PPMP (Optional)</Label>
              <Select
                value={formData.ppmp_file_id}
                onValueChange={(value) => setFormData({ ...formData, ppmp_file_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PPMP file" />
                </SelectTrigger>
                <SelectContent>
                  {ppmpFiles.map((ppmp) => (
                    <SelectItem key={ppmp.id} value={ppmp.id}>
                      {ppmp.file_name} ({ppmp.fiscal_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Additional Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Any additional notes or special requirements"
              rows={2}
            />
          </div>

          <PRItemsForm items={items} onItemsChange={setItems} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? 'Creating...' : 'Create Purchase Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
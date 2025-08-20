import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PPMPWizard } from '@/components/PPMPWizard';

interface CreatePPMPDialogProps {
  onPPMPCreated: () => void;
}

export const CreatePPMPDialog: React.FC<CreatePPMPDialogProps> = ({ onPPMPCreated }) => {
  const [open, setOpen] = useState(false);
  const handleComplete = () => {
    setOpen(false);
    onPPMPCreated();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New PPMP
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <PPMPWizard onComplete={handleComplete} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
};
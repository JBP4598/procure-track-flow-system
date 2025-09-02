import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PPMPWizard } from '@/components/PPMPWizard';

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

interface PPMPEditDialogProps {
  ppmpFile: PPMPFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const PPMPEditDialog: React.FC<PPMPEditDialogProps> = ({
  ppmpFile,
  open,
  onOpenChange,
  onComplete
}) => {
  const handleComplete = () => {
    onOpenChange(false);
    onComplete();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit PPMP: {ppmpFile?.file_name}</DialogTitle>
        </DialogHeader>
        {ppmpFile && (
          <PPMPWizard 
            onComplete={handleComplete} 
            onCancel={handleCancel}
            editingPPMP={ppmpFile}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
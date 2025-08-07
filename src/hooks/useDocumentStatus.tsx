import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type DocumentType = 'purchase_requests' | 'purchase_orders' | 'inspection_reports' | 'disbursement_vouchers';
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'for_signature' | 'paid' | 'cancelled';

interface UseDocumentStatusProps {
  documentType: DocumentType;
  documentId: string;
}

export const useDocumentStatus = ({ documentType, documentId }: UseDocumentStatusProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<DocumentStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentStatus();
  }, [documentType, documentId]);

  const fetchCurrentStatus = async () => {
    try {
      let statusField = 'status';
      if (documentType === 'inspection_reports') {
        statusField = 'overall_result';
      }

      const { data, error } = await supabase
        .from(documentType)
        .select(statusField)
        .eq('id', documentId)
        .single();

      if (error) throw error;
      setCurrentStatus(data[statusField]);
    } catch (error: any) {
      console.error('Error fetching document status:', error);
    }
  };

  const updateStatus = async (newStatus: DocumentStatus, remarks?: string) => {
    setLoading(true);
    try {
      let statusField = 'status';
      if (documentType === 'inspection_reports') {
        statusField = 'overall_result';
      }

      const updateData: any = { [statusField]: newStatus };
      
      // Add approval fields for approved status
      if (newStatus === 'approved') {
        updateData.approved_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.approved_at = new Date().toISOString();
      }
      
      // Add remarks if provided
      if (remarks) {
        updateData.remarks = remarks;
      }

      const { error } = await supabase
        .from(documentType)
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;

      setCurrentStatus(newStatus);
      
      toast({
        title: "Status updated",
        description: `Document status changed to ${newStatus}`,
      });

      // Handle automatic workflow progression
      await handleWorkflowProgression(newStatus);
      
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update document status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowProgression = async (status: DocumentStatus) => {
    try {
      // Auto-generate PO when PR is approved
      if (documentType === 'purchase_requests' && status === 'approved') {
        await generatePurchaseOrder();
      }
      
      // Auto-generate DV when IAR is completed
      if (documentType === 'inspection_reports' && status === 'approved') {
        await generateDisbursementVoucher();
      }
    } catch (error: any) {
      console.error('Workflow progression error:', error);
    }
  };

  const generatePurchaseOrder = async () => {
    try {
      // Get PR details and items
      const { data: prData, error: prError } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          pr_items (*)
        `)
        .eq('id', documentId)
        .single();

      if (prError) throw prError;

      // Generate PO number
      const { data: poNumber } = await supabase.rpc('generate_document_number', {
        prefix: 'PO',
        table_name: 'purchase_orders'
      });

      // Create PO
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          total_amount: prData.total_amount,
          supplier_name: 'To be assigned',
          created_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'pending'
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create PO items
      const poItems = prData.pr_items.map((item: any) => ({
        po_id: poData.id,
        pr_item_id: item.id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
        remaining_quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('po_items')
        .insert(poItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Purchase Order Generated",
        description: `PO ${poNumber} has been automatically created`,
      });
    } catch (error: any) {
      console.error('Error generating PO:', error);
    }
  };

  const generateDisbursementVoucher = async () => {
    try {
      // Get IAR details
      const { data: iarData, error: iarError } = await supabase
        .from('inspection_reports')
        .select(`
          *,
          purchase_orders (*)
        `)
        .eq('id', documentId)
        .single();

      if (iarError) throw iarError;

      // Generate DV number
      const { data: dvNumber } = await supabase.rpc('generate_document_number', {
        prefix: 'DV',
        table_name: 'disbursement_vouchers'
      });

      // Create DV
      const { error: dvError } = await supabase
        .from('disbursement_vouchers')
        .insert({
          dv_number: dvNumber,
          iar_id: documentId,
          po_id: iarData.po_id,
          amount: iarData.purchase_orders.total_amount,
          payee_name: iarData.purchase_orders.supplier_name,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'for_signature'
        });

      if (dvError) throw dvError;

      toast({
        title: "Disbursement Voucher Generated",
        description: `DV ${dvNumber} has been automatically created`,
      });
    } catch (error: any) {
      console.error('Error generating DV:', error);
    }
  };

  return {
    currentStatus,
    loading,
    updateStatus,
    refetchStatus: fetchCurrentStatus
  };
};
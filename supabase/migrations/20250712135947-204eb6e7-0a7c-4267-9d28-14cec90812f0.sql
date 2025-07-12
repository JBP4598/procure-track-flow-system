-- Enable RLS on disbursement_vouchers table
ALTER TABLE public.disbursement_vouchers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disbursement_vouchers table

-- Accountants and admins can create disbursement vouchers
CREATE POLICY "Accountants and admins can create DVs"
ON public.disbursement_vouchers
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'accountant'::user_role) OR
  has_role(auth.uid(), 'admin'::user_role)
);

-- Accountants and admins can update disbursement vouchers
CREATE POLICY "Accountants and admins can update DVs"
ON public.disbursement_vouchers
FOR UPDATE
USING (
  has_role(auth.uid(), 'accountant'::user_role) OR
  has_role(auth.uid(), 'admin'::user_role)
);

-- Users can view DVs for their department's IARs
CREATE POLICY "Users can view DVs from department IARs"
ON public.disbursement_vouchers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM inspection_reports ir
    JOIN purchase_orders po ON ir.po_id = po.id
    JOIN purchase_requests pr ON EXISTS (
      SELECT 1 FROM pr_items pri
      JOIN po_items poi ON pri.id = poi.pr_item_id
      WHERE poi.po_id = po.id AND pri.pr_id = pr.id
    )
    WHERE ir.id = disbursement_vouchers.iar_id
    AND pr.department_id = get_user_department(auth.uid())
  )
);
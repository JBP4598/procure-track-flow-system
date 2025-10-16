-- Drop all policies that depend on has_role(uuid, user_role)
DROP POLICY IF EXISTS "Accountants and admins can create DVs" ON public.disbursement_vouchers;
DROP POLICY IF EXISTS "Accountants and admins can update DVs" ON public.disbursement_vouchers;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "BAC users can create PO items" ON public.po_items;
DROP POLICY IF EXISTS "BAC users can update PO items" ON public.po_items;
DROP POLICY IF EXISTS "Users can view budget savings from their department" ON public.budget_savings;
DROP POLICY IF EXISTS "Admins and accountants can create budget savings" ON public.budget_savings;
DROP POLICY IF EXISTS "Admins and accountants can update budget savings" ON public.budget_savings;
DROP POLICY IF EXISTS "Admins can delete budget savings" ON public.budget_savings;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Department users can view department activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Inspectors and admins can create inspection reports" ON public.inspection_reports;
DROP POLICY IF EXISTS "Inspectors and admins can update inspection reports" ON public.inspection_reports;
DROP POLICY IF EXISTS "Inspectors and admins can create IAR items" ON public.iar_items;
DROP POLICY IF EXISTS "Inspectors and admins can update IAR items" ON public.iar_items;
DROP POLICY IF EXISTS "Users with BAC or admin role can create POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users with BAC or admin role can update POs" ON public.purchase_orders;

-- Drop the old has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, user_role);

-- Create new has_role function with app_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Recreate all policies with app_role
CREATE POLICY "Accountants and admins can create DVs"
ON public.disbursement_vouchers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Accountants and admins can update DVs"
ON public.disbursement_vouchers FOR UPDATE
USING (has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "BAC users can create PO items"
ON public.po_items FOR INSERT
WITH CHECK (has_role(auth.uid(), 'bac'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "BAC users can update PO items"
ON public.po_items FOR UPDATE
USING (has_role(auth.uid(), 'bac'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view budget savings from their department"
ON public.budget_savings FOR SELECT
USING (
  (ppmp_item_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM ppmp_items pi JOIN ppmp_files pf ON pi.ppmp_file_id = pf.id
    WHERE pi.id = budget_savings.ppmp_item_id AND pf.department_id = get_user_department(auth.uid())
  ))
  OR (pr_item_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM pr_items pri JOIN purchase_requests pr ON pri.pr_id = pr.id
    WHERE pri.id = budget_savings.pr_item_id AND pr.department_id = get_user_department(auth.uid())
  ))
  OR (po_item_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM po_items poi JOIN pr_items pri ON poi.pr_item_id = pri.id JOIN purchase_requests pr ON pri.pr_id = pr.id
    WHERE poi.id = budget_savings.po_item_id AND pr.department_id = get_user_department(auth.uid())
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins and accountants can create budget savings"
ON public.budget_savings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Admins and accountants can update budget savings"
ON public.budget_savings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Admins can delete budget savings"
ON public.budget_savings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Department users can view department activity logs"
ON public.activity_logs FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid() AND p2.id = activity_logs.user_id AND p1.department_id = p2.department_id
  )
);

CREATE POLICY "Inspectors and admins can create inspection reports"
ON public.inspection_reports FOR INSERT
WITH CHECK (has_role(auth.uid(), 'inspector'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inspectors and admins can update inspection reports"
ON public.inspection_reports FOR UPDATE
USING (has_role(auth.uid(), 'inspector'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inspectors and admins can create IAR items"
ON public.iar_items FOR INSERT
WITH CHECK (has_role(auth.uid(), 'inspector'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inspectors and admins can update IAR items"
ON public.iar_items FOR UPDATE
USING (has_role(auth.uid(), 'inspector'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users with BAC or admin role can create POs"
ON public.purchase_orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'bac'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users with BAC or admin role can update POs"
ON public.purchase_orders FOR UPDATE
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'bac'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
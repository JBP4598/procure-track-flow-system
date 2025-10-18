-- Drop existing policies that have incorrect role context
DROP POLICY IF EXISTS "Users with BAC or admin role can create POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users with BAC or admin role can update POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can view POs from their department PRs" ON public.purchase_orders;

-- Recreate policies with explicit TO authenticated clause
-- This ensures auth.uid() has proper access to JWT token claims
CREATE POLICY "Users with BAC or admin role can create POs"
ON public.purchase_orders
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'bac'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users with BAC or admin role can update POs"
ON public.purchase_orders
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'bac'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view POs from their department PRs"
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
  can_user_access_po(auth.uid(), id)
);
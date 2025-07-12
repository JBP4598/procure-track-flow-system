-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view POs from their department PRs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can view PO items from accessible POs" ON public.po_items;

-- Create security definer functions to break the circular dependency

-- Function to check if user can access a purchase order
CREATE OR REPLACE FUNCTION public.can_user_access_po(_user_id uuid, _po_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM purchase_requests pr
    JOIN pr_items pri ON pr.id = pri.pr_id
    JOIN po_items poi ON pri.id = poi.pr_item_id
    WHERE poi.po_id = _po_id 
    AND pr.department_id = get_user_department(_user_id)
  )
$$;

-- Function to check if user can access a po_item
CREATE OR REPLACE FUNCTION public.can_user_access_po_item(_user_id uuid, _po_item_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM po_items poi
    JOIN pr_items pri ON poi.pr_item_id = pri.id
    JOIN purchase_requests pr ON pri.pr_id = pr.id
    WHERE poi.id = _po_item_id 
    AND pr.department_id = get_user_department(_user_id)
  )
$$;

-- Recreate the policies using the security definer functions

-- Policy to allow users to view POs from their department's PRs
CREATE POLICY "Users can view POs from their department PRs" 
ON public.purchase_orders 
FOR SELECT 
USING (can_user_access_po(auth.uid(), id));

-- Policy to allow users to view PO items from their department's PRs
CREATE POLICY "Users can view PO items from accessible POs" 
ON public.po_items 
FOR SELECT 
USING (can_user_access_po_item(auth.uid(), id));
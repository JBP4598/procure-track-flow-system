-- Drop the existing problematic RLS policy
DROP POLICY IF EXISTS "BAC users can create POs" ON purchase_orders;

-- Create a more robust RLS policy for PO creation
CREATE POLICY "Users with BAC or admin role can create POs" 
ON purchase_orders 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'bac'::user_role) OR has_role(auth.uid(), 'admin'::user_role))
);

-- Also update the existing update policy to be more robust
DROP POLICY IF EXISTS "BAC users can update POs" ON purchase_orders;

CREATE POLICY "Users with BAC or admin role can update POs" 
ON purchase_orders 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'bac'::user_role) OR has_role(auth.uid(), 'admin'::user_role))
);
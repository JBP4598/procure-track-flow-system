-- Fix RLS policy for purchase orders to handle auth context better
DROP POLICY IF EXISTS "BAC users can create POs" ON purchase_orders;

-- Create a more robust INSERT policy that handles null auth.uid() cases
CREATE POLICY "BAC users can create POs" 
ON purchase_orders 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'bac'::user_role) OR 
    has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Also ensure the created_by field is properly set by adding a default
ALTER TABLE purchase_orders 
ALTER COLUMN created_by SET DEFAULT auth.uid();
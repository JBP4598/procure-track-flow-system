-- Create a more robust authentication debugging approach for purchase orders

-- First, let's create a function to debug the authentication context
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'session_user', session_user,
    'current_user', current_user
  );
$$;

-- Create a better RLS policy that validates the created_by field explicitly
DROP POLICY IF EXISTS "BAC users can create POs" ON purchase_orders;

CREATE POLICY "BAC users can create POs" 
ON purchase_orders 
FOR INSERT 
WITH CHECK (
  -- Ensure the created_by field matches the authenticated user
  created_by = auth.uid()
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'bac'::user_role) OR 
    has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Also create a function to safely create POs with proper authentication
CREATE OR REPLACE FUNCTION public.create_purchase_order(
  po_number text,
  supplier_name text,
  supplier_address text DEFAULT NULL,
  supplier_contact text DEFAULT NULL,
  terms_conditions text DEFAULT NULL,
  delivery_date date DEFAULT NULL,
  total_amount numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  po_id uuid;
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user has required role
  IF NOT (has_role(current_user_id, 'bac'::user_role) OR has_role(current_user_id, 'admin'::user_role)) THEN
    RAISE EXCEPTION 'User does not have permission to create purchase orders';
  END IF;
  
  -- Insert the purchase order
  INSERT INTO purchase_orders (
    po_number,
    supplier_name,
    supplier_address,
    supplier_contact,
    terms_conditions,
    delivery_date,
    total_amount,
    created_by,
    status
  ) VALUES (
    po_number,
    supplier_name,
    supplier_address,
    supplier_contact,
    terms_conditions,
    delivery_date,
    total_amount,
    current_user_id,
    'pending'::po_status
  ) RETURNING id INTO po_id;
  
  RETURN po_id;
END;
$$;
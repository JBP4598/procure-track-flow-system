-- Drop existing policies on user_roles that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can assign roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can remove roles" ON user_roles;

-- Recreate policies using has_role security definer function to prevent recursion
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can assign roles"
ON user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can modify roles"
ON user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can remove roles"
ON user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Departments are viewable by authenticated users" ON departments;

-- Create a new policy that allows everyone (authenticated or anonymous) to view departments
CREATE POLICY "Departments are viewable by everyone"
ON departments
FOR SELECT
TO public
USING (true);
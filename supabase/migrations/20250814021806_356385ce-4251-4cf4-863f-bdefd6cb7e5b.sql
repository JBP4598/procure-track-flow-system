-- Enable RLS on activity_logs table
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own activity logs
CREATE POLICY "Users can view their own activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow admins to view all activity logs
CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Policy to allow department users to view logs from their department
CREATE POLICY "Department users can view department activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR
  EXISTS (
    SELECT 1 
    FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid() 
    AND p2.id = activity_logs.user_id
    AND p1.department_id = p2.department_id
  )
);

-- Restrict INSERT to authenticated users only (for system logging)
CREATE POLICY "Authenticated users can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE policies - activity logs should be immutable
CREATE POLICY "No updates allowed on activity logs" 
ON public.activity_logs 
FOR UPDATE 
USING (false);

CREATE POLICY "No deletes allowed on activity logs" 
ON public.activity_logs 
FOR DELETE 
USING (false);
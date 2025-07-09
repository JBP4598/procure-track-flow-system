-- Enable RLS on pr_items table
ALTER TABLE public.pr_items ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view PR items from their department's PRs
CREATE POLICY "Users can view PR items from accessible PRs" 
ON public.pr_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM purchase_requests 
  WHERE purchase_requests.id = pr_items.pr_id 
  AND purchase_requests.department_id = get_user_department(auth.uid())
));

-- Policy to allow users to create PR items for their department's PRs
CREATE POLICY "Users can create PR items for their department PRs" 
ON public.pr_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 
  FROM purchase_requests 
  WHERE purchase_requests.id = pr_items.pr_id 
  AND purchase_requests.department_id = get_user_department(auth.uid())
));

-- Policy to allow users to update PR items from their department's PRs
CREATE POLICY "Users can update PR items from their department PRs" 
ON public.pr_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 
  FROM purchase_requests 
  WHERE purchase_requests.id = pr_items.pr_id 
  AND purchase_requests.department_id = get_user_department(auth.uid())
));

-- Policy to allow users to delete PR items from their department's PRs
CREATE POLICY "Users can delete PR items from their department PRs" 
ON public.pr_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 
  FROM purchase_requests 
  WHERE purchase_requests.id = pr_items.pr_id 
  AND purchase_requests.department_id = get_user_department(auth.uid())
));

-- Also add missing UPDATE policy for purchase_requests
CREATE POLICY "Users can update their department PRs" 
ON public.purchase_requests 
FOR UPDATE 
USING (department_id = get_user_department(auth.uid()));

-- Enable RLS on inspection_reports table
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

-- Enable RLS on iar_items table  
ALTER TABLE public.iar_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspection_reports table

-- Inspectors and admins can create inspection reports
CREATE POLICY "Inspectors and admins can create inspection reports"
ON public.inspection_reports
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'inspector'::user_role) OR 
  has_role(auth.uid(), 'admin'::user_role)
);

-- Inspectors and admins can update inspection reports
CREATE POLICY "Inspectors and admins can update inspection reports"
ON public.inspection_reports
FOR UPDATE
USING (
  has_role(auth.uid(), 'inspector'::user_role) OR 
  has_role(auth.uid(), 'admin'::user_role)
);

-- Users can view inspection reports for their department's POs
CREATE POLICY "Users can view inspection reports from department POs"
ON public.inspection_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM purchase_orders po
    JOIN purchase_requests pr ON EXISTS (
      SELECT 1 FROM pr_items pri 
      JOIN po_items poi ON pri.id = poi.pr_item_id 
      WHERE poi.po_id = po.id AND pri.pr_id = pr.id
    )
    WHERE po.id = inspection_reports.po_id 
    AND pr.department_id = get_user_department(auth.uid())
  )
);

-- RLS Policies for iar_items table

-- Inspectors and admins can create IAR items
CREATE POLICY "Inspectors and admins can create IAR items"
ON public.iar_items
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'inspector'::user_role) OR 
  has_role(auth.uid(), 'admin'::user_role)
);

-- Inspectors and admins can update IAR items
CREATE POLICY "Inspectors and admins can update IAR items"
ON public.iar_items
FOR UPDATE
USING (
  has_role(auth.uid(), 'inspector'::user_role) OR 
  has_role(auth.uid(), 'admin'::user_role)
);

-- Users can view IAR items from accessible inspection reports
CREATE POLICY "Users can view IAR items from accessible reports"
ON public.iar_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM inspection_reports ir
    JOIN purchase_orders po ON ir.po_id = po.id
    JOIN purchase_requests pr ON EXISTS (
      SELECT 1 FROM pr_items pri 
      JOIN po_items poi ON pri.id = poi.pr_item_id 
      WHERE poi.po_id = po.id AND pri.pr_id = pr.id
    )
    WHERE ir.id = iar_items.iar_id 
    AND pr.department_id = get_user_department(auth.uid())
  )
);

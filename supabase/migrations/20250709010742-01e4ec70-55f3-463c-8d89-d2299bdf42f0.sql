-- Enable RLS on purchase_orders table
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on po_items table  
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view POs from their department's PRs
CREATE POLICY "Users can view POs from their department PRs" 
ON public.purchase_orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM purchase_requests pr
  JOIN pr_items pri ON pr.id = pri.pr_id
  JOIN po_items poi ON pri.id = poi.pr_item_id
  WHERE poi.po_id = purchase_orders.id 
  AND pr.department_id = get_user_department(auth.uid())
));

-- Policy to allow BAC/Admin users to create POs
CREATE POLICY "BAC users can create POs" 
ON public.purchase_orders 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'bac') OR 
  has_role(auth.uid(), 'admin')
);

-- Policy to allow BAC/Admin users to update POs
CREATE POLICY "BAC users can update POs" 
ON public.purchase_orders 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'bac') OR 
  has_role(auth.uid(), 'admin')
);

-- Policy to allow users to view PO items from their department's PRs
CREATE POLICY "Users can view PO items from accessible POs" 
ON public.po_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM purchase_orders po
  JOIN purchase_requests pr ON EXISTS (
    SELECT 1 FROM pr_items pri 
    WHERE pri.id = po_items.pr_item_id 
    AND pri.pr_id = pr.id
  )
  WHERE po.id = po_items.po_id 
  AND pr.department_id = get_user_department(auth.uid())
));

-- Policy to allow BAC/Admin users to create PO items
CREATE POLICY "BAC users can create PO items" 
ON public.po_items 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'bac') OR 
  has_role(auth.uid(), 'admin')
);

-- Policy to allow BAC/Admin users to update PO items
CREATE POLICY "BAC users can update PO items" 
ON public.po_items 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'bac') OR 
  has_role(auth.uid(), 'admin')
);
-- Allow admins to delete inspection reports
CREATE POLICY "Admins can delete inspection reports"
ON inspection_reports
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete IAR items
CREATE POLICY "Admins can delete IAR items"
ON iar_items
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
-- Make po_id nullable to support emergency purchases
ALTER TABLE inspection_reports ALTER COLUMN po_id DROP NOT NULL;

-- Add emergency purchase fields
ALTER TABLE inspection_reports 
  ADD COLUMN is_emergency_purchase boolean DEFAULT false,
  ADD COLUMN emergency_supplier_name text,
  ADD COLUMN emergency_amount numeric,
  ADD COLUMN emergency_reference text;

-- Add check constraint: if emergency purchase, emergency fields required; otherwise po_id required
ALTER TABLE inspection_reports 
  ADD CONSTRAINT check_emergency_fields 
  CHECK (
    (is_emergency_purchase = false AND po_id IS NOT NULL) OR
    (is_emergency_purchase = true AND 
     emergency_supplier_name IS NOT NULL AND 
     emergency_amount IS NOT NULL AND
     emergency_reference IS NOT NULL)
  );
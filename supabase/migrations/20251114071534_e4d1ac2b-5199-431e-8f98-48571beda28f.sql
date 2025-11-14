-- Add execution tracking fields to ppmp_items table
ALTER TABLE ppmp_items
ADD COLUMN pr_submitted_date DATE,
ADD COLUMN pr_actual_amount NUMERIC,
ADD COLUMN po_number TEXT,
ADD COLUMN po_actual_amount NUMERIC,
ADD COLUMN winning_supplier TEXT,
ADD COLUMN dv_prepared_date DATE,
ADD COLUMN dv_actual_amount NUMERIC,
ADD COLUMN budget_variance NUMERIC,
ADD COLUMN execution_status TEXT DEFAULT 'planned';

-- Add check constraint for execution_status
ALTER TABLE ppmp_items
ADD CONSTRAINT ppmp_items_execution_status_check 
CHECK (execution_status IN ('planned', 'pr_submitted', 'po_issued', 'completed'));

-- Add index for execution status queries
CREATE INDEX idx_ppmp_items_execution_status ON ppmp_items(execution_status);

-- Add comment for documentation
COMMENT ON COLUMN ppmp_items.execution_status IS 'Tracks the current stage in procurement lifecycle: planned, pr_submitted, po_issued, completed';
COMMENT ON COLUMN ppmp_items.budget_variance IS 'Calculated variance between planned and actual amounts (total_cost - actual_amount)';
COMMENT ON COLUMN ppmp_items.pr_actual_amount IS 'Actual amount in the Purchase Request (may differ from planned)';
COMMENT ON COLUMN ppmp_items.po_actual_amount IS 'Actual Purchase Order amount after bidding/canvassing';
COMMENT ON COLUMN ppmp_items.dv_actual_amount IS 'Final actual payment amount from Disbursement Voucher';
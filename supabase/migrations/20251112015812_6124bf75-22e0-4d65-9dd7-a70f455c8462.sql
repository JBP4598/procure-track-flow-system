-- Add fund_type to ppmp_files table
ALTER TABLE ppmp_files 
ADD COLUMN fund_type TEXT DEFAULT 'general_fund' CHECK (fund_type IN ('general_fund', 'trust_fund'));

-- Add comment
COMMENT ON COLUMN ppmp_files.fund_type IS 'Type of fund: general_fund or trust_fund';
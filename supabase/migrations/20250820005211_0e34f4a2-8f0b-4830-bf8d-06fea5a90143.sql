-- Extend ppmp_files table with template-specific fields
ALTER TABLE ppmp_files ADD COLUMN IF NOT EXISTS ppmp_number TEXT;
ALTER TABLE ppmp_files ADD COLUMN IF NOT EXISTS status_type TEXT DEFAULT 'INDICATIVE' CHECK (status_type IN ('INDICATIVE', 'FINAL'));
ALTER TABLE ppmp_files ADD COLUMN IF NOT EXISTS end_user_unit TEXT;
ALTER TABLE ppmp_files ADD COLUMN IF NOT EXISTS prepared_by UUID REFERENCES auth.users(id);
ALTER TABLE ppmp_files ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);
ALTER TABLE ppmp_files ADD COLUMN IF NOT EXISTS prepared_date DATE;
ALTER TABLE ppmp_files ADD COLUMN IF NOT EXISTS submitted_date DATE;
ALTER TABLE ppmp_files ADD COLUMN IF NOT EXISTS agency_letterhead_url TEXT;

-- Enhance ppmp_items table to match the 12-column template
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS project_objective TEXT;
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS project_type TEXT CHECK (project_type IN ('Infrastructure', 'Consulting Services', 'Goods', 'Other'));
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS project_size TEXT;
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS recommended_procurement_mode TEXT;
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS pre_procurement_conference BOOLEAN DEFAULT false;
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS procurement_start_date DATE;
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS procurement_end_date DATE;
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS expected_delivery_period TEXT;
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS source_of_funds TEXT;
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS supporting_documents TEXT[];
ALTER TABLE ppmp_items ADD COLUMN IF NOT EXISTS remarks_additional TEXT;

-- Create function to generate PPMP numbers
CREATE OR REPLACE FUNCTION generate_ppmp_number(dept_code TEXT, fiscal_year INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the next sequential number for this department and fiscal year
    SELECT COALESCE(MAX(CAST(SUBSTRING(ppmp_number FROM dept_code || '-PPMP-(\d+)-' FOR '#"999999"#') AS INTEGER)), 0) + 1
    INTO next_number
    FROM ppmp_files pf
    JOIN departments d ON pf.department_id = d.id
    WHERE d.code = dept_code 
    AND pf.fiscal_year = fiscal_year
    AND ppmp_number IS NOT NULL;
    
    RETURN format('%s-PPMP-%s-%s', dept_code, LPAD(next_number::text, 3, '0'), fiscal_year);
END;
$$;

-- Update RLS policies for ppmp_items
-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can create PPMP items for their department PPMPs" ON ppmp_items;
DROP POLICY IF EXISTS "Users can update PPMP items for their department PPMPs" ON ppmp_items;  
DROP POLICY IF EXISTS "Users can delete PPMP items for their department PPMPs" ON ppmp_items;

-- Users can insert PPMP items for their department PPMPs
CREATE POLICY "Users can create PPMP items for their department PPMPs" 
ON ppmp_items FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM ppmp_files 
    WHERE ppmp_files.id = ppmp_items.ppmp_file_id 
    AND ppmp_files.department_id = get_user_department(auth.uid())
));

-- Users can update PPMP items for their department PPMPs  
CREATE POLICY "Users can update PPMP items for their department PPMPs"
ON ppmp_items FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM ppmp_files 
    WHERE ppmp_files.id = ppmp_items.ppmp_file_id 
    AND ppmp_files.department_id = get_user_department(auth.uid())
));

-- Users can delete PPMP items for their department PPMPs
CREATE POLICY "Users can delete PPMP items for their department PPMPs"
ON ppmp_items FOR DELETE
USING (EXISTS (
    SELECT 1 FROM ppmp_files 
    WHERE ppmp_files.id = ppmp_items.ppmp_file_id 
    AND ppmp_files.department_id = get_user_department(auth.uid())
));
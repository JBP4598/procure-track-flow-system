-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
('documents', 'documents', false),
('attachments', 'attachments', false);

-- Create storage policies for document uploads
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id IN ('documents', 'attachments') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('documents', 'attachments') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id IN ('documents', 'attachments') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id IN ('documents', 'attachments') AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create test users with different roles
-- First, let's update the profiles table to ensure we have proper test users
-- Note: Users will need to be created through the auth system, but we can prepare profiles

-- Update existing user roles if needed
UPDATE profiles 
SET role = 'admin'::user_role 
WHERE email LIKE '%admin%' OR role = 'admin'::user_role;

-- Add sample departments if they don't exist
INSERT INTO departments (name, code) VALUES 
('Information Technology', 'IT'),
('Human Resources', 'HR'),
('Finance', 'FIN'),
('Procurement', 'PROC')
ON CONFLICT (code) DO NOTHING;

-- Create a function to generate sequential numbers for documents
CREATE OR REPLACE FUNCTION generate_document_number(prefix text, table_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number integer;
    year_suffix text;
BEGIN
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Get the next number based on existing records
    EXECUTE format('SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)-'' FOR ''#"999999"#'') AS integer)), 0) + 1 FROM %I WHERE %I LIKE ''%s-%%-%s''', 
                   table_name || '_number', prefix, table_name, table_name || '_number', prefix, year_suffix)
    INTO next_number;
    
    RETURN format('%s-%s-%s', prefix, LPAD(next_number::text, 6, '0'), year_suffix);
END;
$$;

-- Create function to update document status and send notifications
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log the status change in activity_logs
    INSERT INTO activity_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        'UPDATE',
        TG_TABLE_NAME,
        NEW.id,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status)
    );
    
    RETURN NEW;
END;
$$;

-- Add status update triggers to main tables
CREATE TRIGGER purchase_requests_status_trigger
    AFTER UPDATE OF status ON purchase_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_document_status();

CREATE TRIGGER purchase_orders_status_trigger
    AFTER UPDATE OF status ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_document_status();

CREATE TRIGGER inspection_reports_status_trigger
    AFTER UPDATE OF overall_result ON inspection_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_document_status();

CREATE TRIGGER disbursement_vouchers_status_trigger
    AFTER UPDATE OF status ON disbursement_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_document_status();
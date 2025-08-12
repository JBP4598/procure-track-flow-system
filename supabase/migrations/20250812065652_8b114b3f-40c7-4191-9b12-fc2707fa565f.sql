-- Fix the generate_document_number function to use correct column names
CREATE OR REPLACE FUNCTION public.generate_document_number(prefix text, table_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    next_number integer;
    year_suffix text;
    column_name text;
BEGIN
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Determine the correct column name based on table
    CASE table_name
        WHEN 'purchase_requests' THEN column_name := 'pr_number';
        WHEN 'purchase_orders' THEN column_name := 'po_number';
        WHEN 'inspection_reports' THEN column_name := 'iar_number';
        WHEN 'disbursement_vouchers' THEN column_name := 'dv_number';
        ELSE column_name := table_name || '_number';
    END CASE;
    
    -- Get the next number based on existing records
    EXECUTE format('SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)-'' FOR ''#"999999"#'') AS integer)), 0) + 1 FROM %I WHERE %I LIKE ''%s-%%-%s''', 
                   column_name, prefix, table_name, column_name, prefix, year_suffix)
    INTO next_number;
    
    RETURN format('%s-%s-%s', prefix, LPAD(next_number::text, 6, '0'), year_suffix);
END;
$function$;
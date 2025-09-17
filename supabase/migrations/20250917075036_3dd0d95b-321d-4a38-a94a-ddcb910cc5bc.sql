-- Fix remaining search path warnings for all remaining functions
ALTER FUNCTION public.can_user_access_po_item(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.generate_document_number(text, text) SET search_path = public;
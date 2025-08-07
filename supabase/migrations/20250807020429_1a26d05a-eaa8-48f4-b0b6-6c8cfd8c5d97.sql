-- Fix security warnings by setting proper search paths for all functions
ALTER FUNCTION public.get_user_department(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.can_user_access_po(_user_id uuid, _po_id uuid) SET search_path = public;
ALTER FUNCTION public.can_user_access_po_item(_user_id uuid, _po_item_id uuid) SET search_path = public;
ALTER FUNCTION public.has_role(_user_id uuid, _role user_role) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.generate_document_number(prefix text, table_name text) SET search_path = public;
ALTER FUNCTION public.update_document_status() SET search_path = public;
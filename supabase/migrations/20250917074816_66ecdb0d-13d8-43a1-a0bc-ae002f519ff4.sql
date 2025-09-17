-- Fix remaining search path security warnings for existing functions
ALTER FUNCTION public.get_user_department(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, user_role) SET search_path = public;
ALTER FUNCTION public.can_user_access_po(uuid, uuid) SET search_path = public;
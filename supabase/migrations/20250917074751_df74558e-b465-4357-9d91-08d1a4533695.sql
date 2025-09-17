-- Fix search path security warnings for all functions
ALTER FUNCTION public.debug_auth_context() SET search_path = public;
ALTER FUNCTION public.create_purchase_order(text, text, text, text, text, date, numeric) SET search_path = public;
-- Fix the last search path warning for the remaining function
ALTER FUNCTION public.generate_ppmp_number(text, integer) SET search_path = public;
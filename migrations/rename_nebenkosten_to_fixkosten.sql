-- Migration: Rename category "Nebenkosten" to "Fixkosten"
-- Execute this in your Supabase SQL Editor

-- Update the category name from "Nebenkosten" to "Fixkosten"
UPDATE public.categories 
SET name = 'Fixkosten' 
WHERE name = 'Nebenkosten';

-- Alternative: If the category name is case-sensitive, try this variant
UPDATE public.categories 
SET name = 'Fixkosten' 
WHERE LOWER(name) = 'nebenkosten';

-- Verify the change
SELECT id, name, type, color, icon 
FROM public.categories 
WHERE name = 'Fixkosten';
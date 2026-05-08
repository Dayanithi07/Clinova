-- Add caretaker fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS caretaker_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS caretaker_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS caretaker_relation TEXT;

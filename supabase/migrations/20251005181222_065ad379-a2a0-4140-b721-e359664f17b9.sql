-- Add fields to profiles table for leader information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS term_start_date DATE,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Create index for faster queries on role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
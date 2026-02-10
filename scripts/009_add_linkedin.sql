-- Add LinkedIn username to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_username TEXT;

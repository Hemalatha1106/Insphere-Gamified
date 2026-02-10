-- Add Banner URL to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

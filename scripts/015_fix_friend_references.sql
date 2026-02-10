-- Fix friend_requests foreign keys to reference public.profiles
-- This enables Supabase to automatically join with profiles table

-- Drop existing foreign keys
ALTER TABLE public.friend_requests
DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey,
DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

-- Add new foreign keys referencing profiles
ALTER TABLE public.friend_requests
ADD CONSTRAINT friend_requests_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

ALTER TABLE public.friend_requests
ADD CONSTRAINT friend_requests_receiver_id_fkey
FOREIGN KEY (receiver_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

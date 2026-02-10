-- Fix RLS policies for Community Messages
-- The previous policies might have been too strict or failed if the creator wasn't correctly added as a member.
-- This script updates the policies to explicitly allow the Community Creator to read/write messages.

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "messages_select_members" ON public.community_messages;
DROP POLICY IF EXISTS "messages_insert_members" ON public.community_messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.community_messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.community_messages;

-- 2. Create new, more robust SELECT policy
CREATE POLICY "messages_select_policy" ON public.community_messages FOR SELECT USING (
  -- Allow if user is an approved member
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = community_messages.community_id
    AND user_id = auth.uid()
    AND status = 'approved'
  )
  OR
  -- Allow if user is the Creator of the community
  EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = community_messages.community_id
    AND created_by = auth.uid()
  )
);

-- 3. Create new, more robust INSERT policy
CREATE POLICY "messages_insert_policy" ON public.community_messages FOR INSERT WITH CHECK (
  -- Ensure the sender is the authenticated user
  auth.uid() = user_id 
  AND (
    -- Allow if user is an approved member
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = community_messages.community_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
    OR
    -- Allow if user is the Creator of the community
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = community_messages.community_id
      AND created_by = auth.uid()
    )
  )
);

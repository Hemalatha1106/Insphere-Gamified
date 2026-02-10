-- Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Friend Request Policies
-- Users can see requests they sent or received
CREATE POLICY "friend_requests_select_own" ON public.friend_requests 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send requests
CREATE POLICY "friend_requests_insert_own" ON public.friend_requests 
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update requests (accept/reject) if they are the receiver
-- OR cancel if they are the sender (though usually we'd delete)
CREATE POLICY "friend_requests_update_own" ON public.friend_requests 
FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Users can delete requests they sent or received (unfriend/cancel)
CREATE POLICY "friend_requests_delete_own" ON public.friend_requests 
FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Add policy to messages to restrict to friends
-- This is a bit complex in RLS pure SQL for "is friend" check efficiently
-- For now, we'll basic check: Sender must be auth.uid(). 
-- The "Friend" check is best enforced at application layer or via a more complex RLS if strictly needed.
-- But let's add a basic check that helps:
-- Existing policy "messages_insert_own" checks sender_id = auth.uid().
-- We can add a specialized function `is_friend(uid1, uid2)` later if security requires strict DB enforcement.
-- For MVP, application logic + basic Sender check is sufficient for "Personal Messaging".

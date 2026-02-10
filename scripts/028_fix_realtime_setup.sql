-- Fix Realtime Setup and RLS for Messages

-- 1. Enable Realtime for the messages table
-- This is critical for the client to receive 'INSERT' events
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- 3. Re-create RLS Policies

-- SELECT: Users can view messages where they are the sender OR the recipient
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

-- INSERT: Users can insert messages where they are the sender
CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- UPDATE: Users can update messages (e.g. mark as read) if they are sender or recipient
-- (Mainly for recipient to mark as read, but sender might edit in future)
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

-- Enable RLS (just in case it wasn't)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

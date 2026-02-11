-- Enable Realtime for Community Channel Messages
-- This was missing from the initial setup, causing chat messages to not appear immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;

-- Ensure RLS is enabled
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

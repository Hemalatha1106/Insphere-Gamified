-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'channel_message', 'friend_request', 'system')),
    title TEXT NOT NULL,
    content TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Partial unique index to ensure only one unread notification per link (channel)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unread_link 
ON public.notifications (user_id, link) 
WHERE is_read = FALSE AND type = 'channel_message';

-- Trigger for DMs
CREATE OR REPLACE FUNCTION public.handle_new_dm_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
BEGIN
    SELECT display_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
    
    INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
    VALUES (
        NEW.recipient_id,
        'message',
        'New Message',
        'From ' || COALESCE(sender_name, 'Unknown'),
        '/messages', -- Or /messages?user=id if we had that route
        jsonb_build_object('sender_id', NEW.sender_id, 'avatar_url', (SELECT avatar_url FROM public.profiles WHERE id = NEW.sender_id))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_dm_notification ON public.messages;
CREATE TRIGGER on_new_dm_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_dm_notification();

-- Trigger for Channel Messages
CREATE OR REPLACE FUNCTION public.handle_new_channel_notification()
RETURNS TRIGGER AS $$
DECLARE
    channel_info RECORD;
    sender_name TEXT;
BEGIN
    -- Get channel and community info
    SELECT c.name as channel_name, com.id as community_id, com.name as community_name
    INTO channel_info
    FROM public.channels c
    JOIN public.communities com ON c.community_id = com.id
    WHERE c.id = NEW.channel_id;

    SELECT display_name INTO sender_name FROM public.profiles WHERE id = NEW.user_id;

    -- Insert notification for ALL community members (except sender)
    INSERT INTO public.notifications (user_id, type, title, content, link, created_at)
    SELECT 
        cm.user_id,
        'channel_message',
        '#' || channel_info.channel_name,
        'New messages in ' || channel_info.community_name,
        '/community/' || channel_info.community_id, -- Link to community (can't deep link to channel easily yet without selectedChannelId in URL)
        NOW()
    FROM public.community_members cm
    WHERE cm.community_id = channel_info.community_id
      AND cm.user_id != NEW.user_id
    ON CONFLICT (user_id, link) WHERE is_read = FALSE AND type = 'channel_message'
    DO UPDATE SET 
        created_at = NOW(),
        content = 'New messages in ' || EXCLUDED.content; -- Just bump timestamp mainly
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_channel_notification ON public.channel_messages;
CREATE TRIGGER on_new_channel_notification
    AFTER INSERT ON public.channel_messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_channel_notification();

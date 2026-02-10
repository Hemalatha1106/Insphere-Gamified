-- Add last_message_at to channels if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'channels' AND column_name = 'last_message_at') THEN
        ALTER TABLE public.channels ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create table to track user read status for channels
CREATE TABLE IF NOT EXISTS public.channel_read_status (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, channel_id)
);

-- Enable RLS
ALTER TABLE public.channel_read_status ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own read status" ON public.channel_read_status
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own read status" ON public.channel_read_status
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to update channel's last_message_at
CREATE OR REPLACE FUNCTION public.update_channel_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.channels
    SET last_message_at = NEW.created_at
    WHERE id = NEW.channel_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new messages
DROP TRIGGER IF EXISTS update_channel_timestamp ON public.channel_messages;
CREATE TRIGGER update_channel_timestamp
    AFTER INSERT ON public.channel_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_channel_last_message_at();

-- Backfill last_message_at for existing channels
UPDATE public.channels c
SET last_message_at = (
    SELECT MAX(created_at)
    FROM public.channel_messages m
    WHERE m.channel_id = c.id
)
WHERE last_message_at IS NULL;

-- If no messages, use channel creation time
UPDATE public.channels
SET last_message_at = created_at
WHERE last_message_at IS NULL;

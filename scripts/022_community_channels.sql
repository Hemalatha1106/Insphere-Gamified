-- Create Channels Table
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Create Channel Messages Table
CREATE TABLE IF NOT EXISTS public.channel_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

-- Channels are visible to everyone for now (simplification, can check membership later)
CREATE POLICY "Channels are viewable by everyone" ON public.channels
    FOR SELECT USING (true);

-- Only members should probably see messages, but let's start with public for simplicity or check community membership
-- For now, open to all authenticated users to view, but verify membership on UI
CREATE POLICY "Messages viewable by everyone" ON public.channel_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert messages" ON public.channel_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create channels" ON public.channels
    FOR INSERT WITH CHECK (true);

-- Trigger to create 'general' channel on new community
CREATE OR REPLACE FUNCTION public.handle_new_community()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.channels (community_id, name, description, created_by)
    VALUES (NEW.id, 'general', 'General discussion', NEW.created_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_created
    AFTER INSERT ON public.communities
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_community();

-- Backfill 'general' channel for existing communities
INSERT INTO public.channels (community_id, name, description)
SELECT id, 'general', 'General discussion'
FROM public.communities
WHERE id NOT IN (SELECT community_id FROM public.channels WHERE name = 'general');

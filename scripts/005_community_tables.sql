-- Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'DSA', 'Web', 'ML', etc.
  type TEXT NOT NULL DEFAULT 'public', -- 'public' or 'private'
  invite_code TEXT UNIQUE,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community members table
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'moderator', 'member'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Create community messages table (for Realtime Chat)
CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Communities Policies
CREATE POLICY "communities_select_all" ON public.communities FOR SELECT USING (true);
CREATE POLICY "communities_insert_auth" ON public.communities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "communities_update_admin" ON public.communities FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "communities_delete_admin" ON public.communities FOR DELETE USING (auth.uid() = created_by);

-- Members Policies
-- Everyone can see members (needed to check if you are a member)
CREATE POLICY "members_select_all" ON public.community_members FOR SELECT USING (true);

-- Users can request to join (insert their own record)
CREATE POLICY "members_insert_self" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins/mods of the community can update status (approve/reject)
-- This is a bit complex in pure SQL RLS without helper functions, implementing simplified version:
-- "If you are the admin of the community, you can update members"
CREATE POLICY "members_update_admin" ON public.community_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = community_members.community_id 
    AND created_by = auth.uid()
  )
);

-- Messages Policies
-- Only approved members can see messages
CREATE POLICY "messages_select_members" ON public.community_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = community_messages.community_id
    AND user_id = auth.uid()
    AND status = 'approved'
  )
);

-- Only approved members can send messages
CREATE POLICY "messages_insert_members" ON public.community_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = community_messages.community_id
    AND user_id = auth.uid()
    AND status = 'approved'
  )
  AND auth.uid() = user_id
);

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "profiles_select_any" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Coding Stats RLS Policies
CREATE POLICY "coding_stats_select_any" ON public.coding_stats FOR SELECT USING (TRUE);
CREATE POLICY "coding_stats_insert_own" ON public.coding_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coding_stats_update_own" ON public.coding_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "coding_stats_delete_own" ON public.coding_stats FOR DELETE USING (auth.uid() = user_id);

-- Badges RLS Policies (read-only for users)
CREATE POLICY "badges_select_any" ON public.badges FOR SELECT USING (TRUE);

-- User Badges RLS Policies
CREATE POLICY "user_badges_select_any" ON public.user_badges FOR SELECT USING (TRUE);
CREATE POLICY "user_badges_insert_own" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_badges_delete_own" ON public.user_badges FOR DELETE USING (auth.uid() = user_id);

-- Leaderboard RLS Policies (read-only for users)
CREATE POLICY "leaderboard_select_any" ON public.leaderboard FOR SELECT USING (TRUE);

-- Follows RLS Policies
CREATE POLICY "follows_select_any" ON public.follows FOR SELECT USING (TRUE);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Messages RLS Policies
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Community Posts RLS Policies
CREATE POLICY "community_posts_select_any" ON public.community_posts FOR SELECT USING (TRUE);
CREATE POLICY "community_posts_insert_own" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_posts_update_own" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "community_posts_delete_own" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Post Comments RLS Policies
CREATE POLICY "post_comments_select_any" ON public.post_comments FOR SELECT USING (TRUE);
CREATE POLICY "post_comments_insert_own" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_comments_update_own" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "post_comments_delete_own" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Post Likes RLS Policies
CREATE POLICY "post_likes_select_any" ON public.post_likes FOR SELECT USING (TRUE);
CREATE POLICY "post_likes_insert_own" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

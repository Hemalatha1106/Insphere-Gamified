-- Add unique constraint to allow upsert
ALTER TABLE public.coding_stats 
ADD CONSTRAINT coding_stats_user_platform_key UNIQUE (user_id, platform);

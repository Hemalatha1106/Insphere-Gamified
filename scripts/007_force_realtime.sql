-- Force enable Realtime for community_messages
-- Sometimes simpler 'ADD TABLE' commands fail silently if already added in a weird state.

-- 1. Ensure Table Permissions
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- 2. Set Replica Identity to FULL (Ensures all columns are sent in updates/deletes too, helpful for debugging)
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;

-- 3. Explicitly add to publication (idempotent-ish)
-- We'll try to drop it first from the publication to be sure, then add it back.
-- Note: 'DROP TABLE' from publication syntax might vary, usually it's ALTER PUBLICATION ... DROP TABLE
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.community_messages;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if not present
  END;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

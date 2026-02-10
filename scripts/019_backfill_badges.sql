-- Backfill badges for existing users by triggering updates
-- This forces the triggers to run for all records

-- 1. Trigger coding stats badges
UPDATE public.coding_stats 
SET problems_solved = problems_solved 
WHERE TRUE;

-- 2. Trigger profile badges (Rising Star)
UPDATE public.profiles
SET level = level
WHERE TRUE;

-- 3. Manual check for GitHub Master (since we don't have a trigger for it yet in the previous script)
-- Let's just award it if they have a github_username for now as a "Integration" starter
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE github_username IS NOT NULL
  LOOP
    PERFORM public.award_badge(r.id, 'GitHub Master');
  END LOOP;
END;
$$;

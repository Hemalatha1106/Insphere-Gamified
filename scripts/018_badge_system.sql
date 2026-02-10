-- Function to safely award a badge to a user
CREATE OR REPLACE FUNCTION public.award_badge(
  target_user_id UUID,
  badge_name_param TEXT
) RETURNS VOID AS $$
DECLARE
  target_badge_id UUID;
BEGIN
  -- Get the badge ID
  SELECT id INTO target_badge_id FROM public.badges WHERE name = badge_name_param;
  
  -- If badge exists, try to insert into user_badges
  IF target_badge_id IS NOT NULL THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (target_user_id, target_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Check Coding Stats for Badges
CREATE OR REPLACE FUNCTION public.check_coding_badges()
RETURNS TRIGGER AS $$
DECLARE
  total_solved INT;
BEGIN
  -- Calculate total solved across all platforms for this user
  SELECT SUM(problems_solved) INTO total_solved
  FROM public.coding_stats
  WHERE user_id = NEW.user_id;

  -- "First 10 Problems": Solved >= 10
  IF total_solved >= 10 THEN
    PERFORM public.award_badge(NEW.user_id, 'First 10 Problems');
  END IF;

  -- "Century Club": Solved >= 100
  IF total_solved >= 100 THEN
    PERFORM public.award_badge(NEW.user_id, 'Century Club');
  END IF;

  -- "Problem Slayer": Solved >= 500
  IF total_solved >= 500 THEN
    PERFORM public.award_badge(NEW.user_id, 'Problem Slayer');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Coding Stats Update/Insert
DROP TRIGGER IF EXISTS trigger_check_coding_badges ON public.coding_stats;
CREATE TRIGGER trigger_check_coding_badges
AFTER INSERT OR UPDATE OF problems_solved ON public.coding_stats
FOR EACH ROW
EXECUTE FUNCTION public.check_coding_badges();

-- Trigger Function: Check Profile Level for Badges
CREATE OR REPLACE FUNCTION public.check_profile_badges()
RETURNS TRIGGER AS $$
BEGIN
  -- "Rising Star": Level >= 5
  IF NEW.level >= 5 THEN
    PERFORM public.award_badge(NEW.id, 'Rising Star');
  END IF;

  -- "Elite Coder": Level >= 10 (Adding a new one just in case)
  IF NEW.level >= 10 THEN
    -- Ensure this badge exists first or handle gracefully (award_badge handles non-existence safely)
    PERFORM public.award_badge(NEW.id, 'Elite Coder'); 
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Profile Update (Level)
DROP TRIGGER IF EXISTS trigger_check_profile_badges ON public.profiles;
CREATE TRIGGER trigger_check_profile_badges
AFTER UPDATE OF level ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_badges();

-- Pre-seed any missing badges referenced above if they don't exist
INSERT INTO public.badges (name, description, category, points_value) VALUES
  ('Elite Coder', 'Reached level 10', 'level', 300)
ON CONFLICT (name) DO NOTHING;

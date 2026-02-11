-- 1. Insert new badges
INSERT INTO public.badges (name, description, category, points_value) VALUES
  ('LeetCode Knight', 'Achieved 1500+ LeetCode rating', 'achievement', 300),
  ('LeetCode Guardian', 'Achieved 1700+ LeetCode rating', 'achievement', 500),
  ('GeeksForGeeks Master', 'Achieved 500+ Coding Score', 'achievement', 250),
  ('Git Contributor', 'Made 100+ GitHub contributions', 'integration', 150),
  ('Repo Collector', 'Created 10+ Public Repositories', 'integration', 100)
ON CONFLICT (name) DO NOTHING;

-- 2. Update the badge checking function to handle platform-specific logic
CREATE OR REPLACE FUNCTION public.check_coding_badges()
RETURNS TRIGGER AS $$
DECLARE
  total_solved INT;
BEGIN
  -- ---------------------------------------------------------------------------
  -- Global Checks (across all platforms)
  -- ---------------------------------------------------------------------------
  
  -- Calculate total solved across all platforms for this user
  SELECT COALESCE(SUM(problems_solved), 0) INTO total_solved
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

  -- ---------------------------------------------------------------------------
  -- Platform Specific Checks
  -- ---------------------------------------------------------------------------
  
  -- LEETCODE
  IF NEW.platform = 'leetcode' THEN
    -- "LeetCode Knight": Rating >= 1500
    IF NEW.contest_rating >= 1500 THEN
      PERFORM public.award_badge(NEW.user_id, 'LeetCode Knight');
    END IF;
    
    -- "LeetCode Guardian": Rating >= 1700
    IF NEW.contest_rating >= 1700 THEN
      PERFORM public.award_badge(NEW.user_id, 'LeetCode Guardian');
    END IF;
  END IF;

  -- GEEKSFORGEEKS
  -- (Note: 'contest_rating' stores the 'score' for GFG based on the update API)
  IF NEW.platform = 'geeksforgeeks' THEN
    -- "GeeksForGeeks Master": Score >= 500
    IF NEW.contest_rating >= 500 THEN
      PERFORM public.award_badge(NEW.user_id, 'GeeksForGeeks Master');
    END IF;
  END IF;

  -- GITHUB
  -- (Note: 'problems_solved' stores 'contributions', 'total_problems' stores 'public_repos')
  IF NEW.platform = 'github' THEN
    -- "Git Contributor": Contributions >= 100
    IF NEW.problems_solved >= 100 THEN
      PERFORM public.award_badge(NEW.user_id, 'Git Contributor');
    END IF;
    
    -- "Repo Collector": Repos >= 10
    IF NEW.total_problems >= 10 THEN
      PERFORM public.award_badge(NEW.user_id, 'Repo Collector');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

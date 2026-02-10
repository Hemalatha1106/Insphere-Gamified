-- Function to calculate total points for a user based on badges
CREATE OR REPLACE FUNCTION public.calculate_total_points(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  badge_points INT;
BEGIN
  -- Calculate sum of points from all badges earned by the user
  SELECT COALESCE(SUM(b.points_value), 0)
  INTO badge_points
  FROM public.user_badges ub
  JOIN public.badges b ON ub.badge_id = b.id
  WHERE ub.user_id = user_id_param;

  -- Update the profiles table
  UPDATE public.profiles
  SET total_points = badge_points
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: On User Badge Change
CREATE OR REPLACE FUNCTION public.on_user_badge_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.calculate_total_points(OLD.user_id);
  ELSE
    PERFORM public.calculate_total_points(NEW.user_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: After Insert/Delete on user_badges
DROP TRIGGER IF EXISTS trigger_update_points_on_badge ON public.user_badges;
CREATE TRIGGER trigger_update_points_on_badge
AFTER INSERT OR DELETE ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.on_user_badge_change();

-- Backfill: Recalculate points for all users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles
  LOOP
    PERFORM public.calculate_total_points(r.id);
  END LOOP;
END;
$$;

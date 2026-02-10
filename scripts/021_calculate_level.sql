-- Function to calculate level based on points
CREATE OR REPLACE FUNCTION public.calculate_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple formula: Level 1 at 0 pts, Level 2 at 100 pts, etc.
  -- Level = floor(total_points / 100) + 1
  NEW.level := FLOOR(NEW.total_points / 100) + 1;
  
  -- Calculate progress to next level (percentage)
  -- Points in current level = total_points % 100
  NEW.level_progress := NEW.total_points % 100;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update level when total_points changes
DROP TRIGGER IF EXISTS trigger_calculate_level ON public.profiles;
CREATE TRIGGER trigger_calculate_level
BEFORE INSERT OR UPDATE OF total_points ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.calculate_level();

-- Backfill: Update all existing profiles
UPDATE public.profiles SET total_points = total_points;

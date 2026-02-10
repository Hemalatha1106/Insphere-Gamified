-- Insert sample badges
INSERT INTO public.badges (name, description, category, points_value) VALUES
  ('First 10 Problems', 'Solved your first 10 problems', 'achievement', 50),
  ('Century Club', 'Solved 100+ problems', 'achievement', 200),
  ('Problem Slayer', 'Solved 500+ problems', 'achievement', 500),
  ('Contest Champion', 'Participated in 10+ contests', 'contest', 150),
  ('Community Helper', 'Posted 5+ helpful comments', 'community', 75),
  ('Rising Star', 'Reached level 5', 'level', 100),
  ('GitHub Master', 'Connected GitHub with 50+ repos', 'integration', 120),
  ('Streak Master', 'Maintained 30-day streak', 'consistency', 180)
ON CONFLICT (name) DO NOTHING;

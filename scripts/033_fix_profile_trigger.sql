-- Improved profile trigger function to handle OAuth users robustly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  new_username text;
  check_username text;
  is_unique boolean := false;
  loop_count int := 0;
  random_suffix int;
BEGIN
  -- 1. Determine base username from metadata or email
  base_username := COALESCE(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  
  -- 2. Sanitize: lowercase and keep only alphanumeric
  base_username := regexp_replace(lower(base_username), '[^a-z0-9]', '', 'g');
  
  -- 3. Fallback if empty (e.g. if name was "!!!")
  IF length(base_username) < 3 THEN
    base_username := 'user' || substr(md5(random()::text), 1, 4);
  END IF;

  -- 4. Loop to find unique username
  new_username := base_username;
  WHILE NOT is_unique AND loop_count < 10 LOOP
    BEGIN
      -- Check if username exists
      PERFORM 1 FROM public.profiles WHERE username = new_username;
      
      IF NOT FOUND THEN
          -- Attempt insert
          INSERT INTO public.profiles (
            id,
            username,
            display_name,
            bio,
            avatar_url
          )
          VALUES (
            new.id,
            new_username,
            COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
            COALESCE(new.raw_user_meta_data ->> 'bio', ''),
            COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
          );
          
          is_unique := true;
      ELSE
          -- Generate new username with suffix
          random_suffix := floor(random() * 9000) + 1000; -- 1000-9999
          new_username := base_username || random_suffix::text;
      END IF;
      
    EXCEPTION WHEN unique_violation THEN
      -- If race condition caused unique violation despite check
      random_suffix := floor(random() * 9000) + 1000;
      new_username := base_username || random_suffix::text;
    END;
    loop_count := loop_count + 1;
  END LOOP;
  
  -- If still not unique after loops (highly unlikely), fall back to UUID segment
  IF NOT is_unique THEN
      new_username := base_username || '_' || substr(new.id::text, 1, 8);
       INSERT INTO public.profiles (
            id,
            username,
            display_name,
            bio,
            avatar_url
          )
          VALUES (
            new.id,
            new_username,
            COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
            COALESCE(new.raw_user_meta_data ->> 'bio', ''),
            COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
          );
  END IF;

  -- Initialize leaderboard entry
  INSERT INTO public.leaderboard (user_id, rank, total_points, level)
  VALUES (new.id, 999999, 0, 1)
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$;

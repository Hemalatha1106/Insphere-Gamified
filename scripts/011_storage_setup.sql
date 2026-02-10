-- Enable Storage Extension (usually enabled by default in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- Create specific buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;

-- Policies for Avatars
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can update their own avatar."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' );

-- Policies for Banners
CREATE POLICY "Banner images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'banners' );

CREATE POLICY "Anyone can upload a banner."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'banners' );

CREATE POLICY "Anyone can update their own banner."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'banners' );

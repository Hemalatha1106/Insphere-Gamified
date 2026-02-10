-- Add image_url to community_messages
ALTER TABLE public.community_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('message-images', 'message-images', true) ON CONFLICT (id) DO NOTHING;

-- Policies for Community Images
CREATE POLICY "Community images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'community-images' );

CREATE POLICY "Authenticated users can upload community images."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'community-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own community images."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'community-images' AND auth.uid() = owner );

-- Policies for Message Images
CREATE POLICY "Message images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'message-images' );

CREATE POLICY "Authenticated users can upload message images."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'message-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own message images."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'message-images' AND auth.uid() = owner );

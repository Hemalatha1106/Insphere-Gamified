
-- Add tags column to communities table
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Initial backfill based on category (optional but good for consistency)
UPDATE public.communities 
SET tags = ARRAY[category] 
WHERE tags = '{}';

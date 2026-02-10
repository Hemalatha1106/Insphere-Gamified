-- Add type column to channels table
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' NOT NULL;

-- Update existing channels to have type 'text'
UPDATE public.channels SET type = 'text' WHERE type IS NULL;

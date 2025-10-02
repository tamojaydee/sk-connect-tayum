-- Add thumbnail_url and budget fields to events table
ALTER TABLE public.events
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN budget NUMERIC(12, 2);

-- Add comment for clarity
COMMENT ON COLUMN public.events.thumbnail_url IS 'URL to the event thumbnail image stored in Supabase storage';
COMMENT ON COLUMN public.events.budget IS 'Budget allocated for the event in PHP';

-- Create storage bucket for event thumbnails if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-thumbnails', 'event-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for event thumbnails
CREATE POLICY "Anyone can view event thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-thumbnails');

CREATE POLICY "Authenticated users can upload event thumbnails"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-thumbnails' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own event thumbnails"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'event-thumbnails' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own event thumbnails"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-thumbnails' 
  AND auth.role() = 'authenticated'
);
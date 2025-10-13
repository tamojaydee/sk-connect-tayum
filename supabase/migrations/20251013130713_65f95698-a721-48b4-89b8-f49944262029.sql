-- Add thumbnail_url column to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Update events table to add archived_at column
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Update documents table to add archived_at column
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Update projects table to add archived_at column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Create function to auto-archive expired events
CREATE OR REPLACE FUNCTION public.auto_archive_expired_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If event date has passed and status is still active, archive it
  IF NEW.event_date < now() AND NEW.status = 'active' AND NEW.archived_at IS NULL THEN
    NEW.status = 'expired';
    NEW.archived_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-archive events
DROP TRIGGER IF EXISTS auto_archive_events_trigger ON public.events;
CREATE TRIGGER auto_archive_events_trigger
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_archive_expired_events();

-- Add RLS policies for archived items
CREATE POLICY "Main admins can view archived events"
  ON public.events
  FOR SELECT
  USING (
    get_user_role() = 'main_admin'::user_role 
    AND archived_at IS NOT NULL
  );

CREATE POLICY "Main admins can view archived documents"
  ON public.documents  
  FOR SELECT
  USING (
    get_user_role() = 'main_admin'::user_role 
    AND archived_at IS NOT NULL
  );

CREATE POLICY "Main admins can view archived projects"
  ON public.projects
  FOR SELECT
  USING (
    get_user_role() = 'main_admin'::user_role 
    AND archived_at IS NOT NULL
  );
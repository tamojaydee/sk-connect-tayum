-- Add 'archived' as a valid status for events
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
  CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'completed'::text, 'archived'::text]));
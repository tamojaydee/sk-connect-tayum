-- Allow 'expired' as a valid event status so automatic expiry does not
-- violate the events_status_check constraint when updating status.
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'active'::text,
        'cancelled'::text,
        'completed'::text,
        'archived'::text,
        'expired'::text
      ]
    )
  );
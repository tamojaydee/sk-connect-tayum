-- Consolidate duplicate event budget triggers
DROP TRIGGER IF EXISTS event_budget_trigger ON public.events;
DROP TRIGGER IF EXISTS handle_event_budget_trigger ON public.events;
DROP TRIGGER IF EXISTS trg_event_budget ON public.events;

-- Consolidate duplicate archive triggers
DROP TRIGGER IF EXISTS auto_archive_events_trigger ON public.events;
DROP TRIGGER IF EXISTS auto_archive_expired_events_trigger ON public.events;  
DROP TRIGGER IF EXISTS trg_event_auto_archive ON public.events;

-- Create single canonical triggers
CREATE TRIGGER handle_event_budget_trigger
AFTER INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_event_budget();

CREATE TRIGGER auto_archive_expired_events_trigger
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.auto_archive_expired_events();
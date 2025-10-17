-- Fix FK violation by moving budget triggers to AFTER timing
DO $$
BEGIN
  -- Drop existing BEFORE triggers if they exist
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'check_project_budget_trigger'
  ) THEN
    DROP TRIGGER check_project_budget_trigger ON public.projects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'check_event_budget_trigger'
  ) THEN
    DROP TRIGGER check_event_budget_trigger ON public.events;
  END IF;
END $$;

-- Recreate as AFTER triggers so parent rows exist before inserting child transactions
CREATE TRIGGER check_project_budget_trigger
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_budget();

CREATE TRIGGER check_event_budget_trigger
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_budget();
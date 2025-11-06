-- Drop all duplicate project budget triggers
DROP TRIGGER IF EXISTS check_project_budget_trigger ON public.projects;
DROP TRIGGER IF EXISTS handle_project_budget_trigger ON public.projects;
DROP TRIGGER IF EXISTS project_budget_trigger ON public.projects;
DROP TRIGGER IF EXISTS trg_project_budget ON public.projects;

-- Drop all duplicate event budget triggers
DROP TRIGGER IF EXISTS check_event_budget_trigger ON public.events;
DROP TRIGGER IF EXISTS handle_event_budget_trigger ON public.events;

-- Create single trigger for projects (AFTER INSERT OR UPDATE)
CREATE TRIGGER handle_project_budget_trigger
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_budget();

-- Create single trigger for events (AFTER INSERT OR UPDATE)
CREATE TRIGGER handle_event_budget_trigger
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_budget();
-- Create trigger to handle project budget validation
CREATE TRIGGER check_project_budget_trigger
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_budget();

-- Create trigger to handle event budget validation  
CREATE TRIGGER check_event_budget_trigger
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_budget();
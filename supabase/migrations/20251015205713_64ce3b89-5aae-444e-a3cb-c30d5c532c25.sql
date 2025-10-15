-- Create trigger for event budget allocation
CREATE TRIGGER handle_event_budget_trigger
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_budget();

-- Create trigger for project budget allocation
CREATE TRIGGER handle_project_budget_trigger
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_budget();

-- Create trigger to update barangay budget when transactions are created
CREATE TRIGGER update_barangay_budget_trigger
  AFTER INSERT ON public.budget_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_barangay_budget();
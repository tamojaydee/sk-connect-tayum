-- Create necessary triggers for archiving and budget handling

-- 1) Events: auto-archive expired events and handle budget allocations
DROP TRIGGER IF EXISTS trg_event_auto_archive ON public.events;
CREATE TRIGGER trg_event_auto_archive
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.auto_archive_expired_events();

DROP TRIGGER IF EXISTS trg_event_budget ON public.events;
CREATE TRIGGER trg_event_budget
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_event_budget();

-- 2) Projects: create budget transactions when budget is set/changed
DROP TRIGGER IF EXISTS trg_project_budget ON public.projects;
CREATE TRIGGER trg_project_budget
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_project_budget();

-- 3) Budget transactions: update barangay budget totals after each transaction
DROP TRIGGER IF EXISTS trg_update_barangay_budget ON public.budget_transactions;
CREATE TRIGGER trg_update_barangay_budget
AFTER INSERT ON public.budget_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_barangay_budget();
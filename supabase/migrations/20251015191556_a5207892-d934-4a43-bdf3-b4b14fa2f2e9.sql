-- Fix event creation and project deletion issues
-- 1) Adjust trigger timings to avoid FK violations and premature archiving
-- 2) Allow deleting projects/events by nullifying related references in budget_transactions

BEGIN;

-- Recreate event budget trigger as AFTER so the event row exists before inserting a transaction
DROP TRIGGER IF EXISTS trg_event_budget ON public.events;
CREATE TRIGGER trg_event_budget
AFTER INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_event_budget();

-- Recreate project budget trigger as AFTER so the project row exists before inserting a transaction
DROP TRIGGER IF EXISTS trg_project_budget ON public.projects;
CREATE TRIGGER trg_project_budget
AFTER INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_project_budget();

-- Auto-archive should not run on INSERT since it modifies NEW; keep BEFORE UPDATE only
DROP TRIGGER IF EXISTS trg_event_auto_archive ON public.events;
CREATE TRIGGER trg_event_auto_archive
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.auto_archive_expired_events();

-- Update FK: when a project is deleted, keep transaction history by nullifying the reference
ALTER TABLE public.budget_transactions
DROP CONSTRAINT IF EXISTS budget_transactions_related_project_id_fkey;

ALTER TABLE public.budget_transactions
ADD CONSTRAINT budget_transactions_related_project_id_fkey
FOREIGN KEY (related_project_id)
REFERENCES public.projects(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- Update FK: when an event is deleted, keep transaction history by nullifying the reference
ALTER TABLE public.budget_transactions
DROP CONSTRAINT IF EXISTS budget_transactions_related_event_id_fkey;

ALTER TABLE public.budget_transactions
ADD CONSTRAINT budget_transactions_related_event_id_fkey
FOREIGN KEY (related_event_id)
REFERENCES public.events(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

COMMIT;
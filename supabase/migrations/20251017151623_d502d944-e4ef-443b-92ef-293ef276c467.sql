-- Fix the event budget trigger to run AFTER insert instead of BEFORE
-- This ensures the event exists when we create the budget transaction

DROP TRIGGER IF EXISTS handle_event_budget_trigger ON events;

CREATE TRIGGER handle_event_budget_trigger
  AFTER INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_event_budget();
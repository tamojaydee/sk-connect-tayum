-- Fix the project budget trigger to run AFTER insert instead of BEFORE
-- This ensures the project exists when we create the budget transaction

DROP TRIGGER IF EXISTS handle_project_budget_trigger ON projects;

CREATE TRIGGER handle_project_budget_trigger
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_project_budget();

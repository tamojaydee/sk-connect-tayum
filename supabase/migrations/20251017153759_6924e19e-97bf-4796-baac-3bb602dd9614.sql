-- Fix triple-application of budget updates by consolidating triggers on budget_transactions
-- 1) Drop all existing triggers calling update_barangay_budget()
DROP TRIGGER IF EXISTS on_budget_transaction_created ON public.budget_transactions;
DROP TRIGGER IF EXISTS trg_update_barangay_budget ON public.budget_transactions;
DROP TRIGGER IF EXISTS update_barangay_budget_trigger ON public.budget_transactions;

-- 2) Create a single canonical trigger
CREATE TRIGGER update_barangay_budget_trigger
AFTER INSERT ON public.budget_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_barangay_budget();
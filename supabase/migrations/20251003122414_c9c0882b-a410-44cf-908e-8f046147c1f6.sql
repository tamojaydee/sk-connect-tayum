-- Create barangay_budgets table to track budget for each barangay
CREATE TABLE IF NOT EXISTS public.barangay_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE UNIQUE,
  total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  available_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create budget_transactions table to track all budget changes
CREATE TABLE IF NOT EXISTS public.budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add', 'deduct')),
  description TEXT,
  related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.barangay_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for barangay_budgets
CREATE POLICY "SK chairmen can view their barangay budget"
  ON public.barangay_budgets
  FOR SELECT
  USING (
    (barangay_id = get_user_barangay_id() AND get_user_role() = 'sk_chairman'::user_role)
    OR get_user_role() = 'main_admin'::user_role
  );

CREATE POLICY "Main admins and SK chairmen can update their barangay budget"
  ON public.barangay_budgets
  FOR UPDATE
  USING (
    (barangay_id = get_user_barangay_id() AND get_user_role() = 'sk_chairman'::user_role)
    OR get_user_role() = 'main_admin'::user_role
  );

CREATE POLICY "Main admins can insert barangay budgets"
  ON public.barangay_budgets
  FOR INSERT
  WITH CHECK (get_user_role() = 'main_admin'::user_role);

-- RLS policies for budget_transactions
CREATE POLICY "SK chairmen can view their barangay transactions"
  ON public.budget_transactions
  FOR SELECT
  USING (
    (barangay_id = get_user_barangay_id() AND get_user_role() = 'sk_chairman'::user_role)
    OR get_user_role() = 'main_admin'::user_role
  );

CREATE POLICY "Main admins and SK chairmen can create transactions"
  ON public.budget_transactions
  FOR INSERT
  WITH CHECK (
    (barangay_id = get_user_barangay_id() AND get_user_role() IN ('sk_chairman'::user_role, 'main_admin'::user_role))
    OR get_user_role() = 'main_admin'::user_role
  );

-- Create function to update budget when transaction is added
CREATE OR REPLACE FUNCTION update_barangay_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_type = 'add' THEN
    UPDATE barangay_budgets
    SET 
      total_budget = total_budget + NEW.amount,
      available_budget = available_budget + NEW.amount,
      updated_at = now()
    WHERE barangay_id = NEW.barangay_id;
  ELSIF NEW.transaction_type = 'deduct' THEN
    UPDATE barangay_budgets
    SET 
      available_budget = available_budget - NEW.amount,
      updated_at = now()
    WHERE barangay_id = NEW.barangay_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for budget updates
CREATE TRIGGER on_budget_transaction_created
  AFTER INSERT ON public.budget_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_barangay_budget();

-- Create indexes for performance
CREATE INDEX idx_budget_transactions_barangay ON public.budget_transactions(barangay_id);
CREATE INDEX idx_budget_transactions_created_at ON public.budget_transactions(created_at DESC);
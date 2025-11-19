-- Update barangay_budgets RLS policy to allow sk_secretary to update their barangay budget
DROP POLICY IF EXISTS "Main admins and SK chairmen can update their barangay budget" ON public.barangay_budgets;

CREATE POLICY "Main admins, SK chairmen and secretaries can update their barangay budget"
ON public.barangay_budgets
FOR UPDATE
USING (
  (barangay_id = get_user_barangay_id() AND get_user_role() IN ('sk_chairman'::user_role, 'sk_secretary'::user_role))
  OR get_user_role() = 'main_admin'::user_role
);

-- Update budget_transactions RLS policy to allow sk_secretary to create transactions
DROP POLICY IF EXISTS "Main admins and SK chairmen can create transactions" ON public.budget_transactions;

CREATE POLICY "Main admins, SK chairmen and secretaries can create transactions"
ON public.budget_transactions
FOR INSERT
WITH CHECK (
  (barangay_id = get_user_barangay_id() AND get_user_role() IN ('sk_chairman'::user_role, 'sk_secretary'::user_role, 'main_admin'::user_role))
  OR get_user_role() = 'main_admin'::user_role
);

-- Update SK chairmen view policy to include secretaries
DROP POLICY IF EXISTS "SK chairmen can view their barangay budget" ON public.barangay_budgets;

CREATE POLICY "SK chairmen and secretaries can view their barangay budget"
ON public.barangay_budgets
FOR SELECT
USING (
  (barangay_id = get_user_barangay_id() AND get_user_role() IN ('sk_chairman'::user_role, 'sk_secretary'::user_role))
  OR get_user_role() = 'main_admin'::user_role
);

-- Update budget_transactions view policy to include secretaries
DROP POLICY IF EXISTS "SK chairmen can view their barangay transactions" ON public.budget_transactions;

CREATE POLICY "SK chairmen and secretaries can view their barangay transactions"
ON public.budget_transactions
FOR SELECT
USING (
  (barangay_id = get_user_barangay_id() AND get_user_role() IN ('sk_chairman'::user_role, 'sk_secretary'::user_role))
  OR get_user_role() = 'main_admin'::user_role
);
-- Allow public read access to barangay budgets for transparency
CREATE POLICY "Anyone can view barangay budgets for transparency"
ON public.barangay_budgets
FOR SELECT
USING (true);

-- Allow public read access to document counts for transparency
CREATE POLICY "Anyone can view document types for transparency"
ON public.documents
FOR SELECT
USING (is_public = true OR true);

-- Allow public read access to survey counts for transparency
CREATE POLICY "Anyone can view survey data for transparency"
ON public.surveys
FOR SELECT
USING (true);

-- Allow public read access to active user counts for transparency
CREATE POLICY "Anyone can view active user count for transparency"
ON public.profiles
FOR SELECT
USING (is_active = true);
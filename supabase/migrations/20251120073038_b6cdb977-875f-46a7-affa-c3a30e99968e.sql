-- Add unique constraint to ensure only one secretary per barangay
CREATE UNIQUE INDEX unique_secretary_per_barangay 
ON public.profiles (barangay_id) 
WHERE role = 'sk_secretary';
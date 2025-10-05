-- Drop existing policy if it exists and recreate with proper public access
DROP POLICY IF EXISTS "Anyone can view barangays" ON public.barangays;

-- Create a policy that explicitly allows public SELECT access for anonymous users
CREATE POLICY "Public can view all barangays"
ON public.barangays
FOR SELECT
TO public
USING (true);

-- Also ensure authenticated users can view
CREATE POLICY "Authenticated can view all barangays"
ON public.barangays
FOR SELECT
TO authenticated
USING (true);
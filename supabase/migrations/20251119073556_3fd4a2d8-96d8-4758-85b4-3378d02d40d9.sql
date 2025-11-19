-- Add DELETE policies for surveys table
CREATE POLICY "Main admins can delete surveys"
ON public.surveys
FOR DELETE
USING (get_user_role() = 'main_admin'::user_role);

CREATE POLICY "SK chairmen can delete surveys from their barangay"
ON public.surveys
FOR DELETE
USING (
  get_user_role() = 'sk_chairman'::user_role 
  AND barangay_id = get_user_barangay_id()
);
-- Allow main_admin to create documents regardless of barangay
CREATE POLICY main_admins_can_create_documents
ON public.documents
FOR INSERT
WITH CHECK (public.get_user_role() = 'main_admin'::user_role);
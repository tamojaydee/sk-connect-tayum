-- Allow main_admin to create events regardless of barangay
CREATE POLICY main_admins_can_create_events
ON public.events
FOR INSERT
WITH CHECK (public.get_user_role() = 'main_admin'::user_role);
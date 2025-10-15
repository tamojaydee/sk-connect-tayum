-- Fix the handle_new_user trigger to set barangay_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, barangay_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'kagawad'),
    (NEW.raw_user_meta_data->>'barangay_id')::uuid
  );
  RETURN NEW;
END;
$function$;

-- Update the RLS policy to allow SK chairmen to update kagawad profiles without barangay_id
DROP POLICY IF EXISTS "SK chairmen can update kagawad profiles in their barangay" ON public.profiles;

CREATE POLICY "SK chairmen can update kagawad profiles in their barangay"
ON public.profiles FOR UPDATE
USING (
  (
    SELECT p.role = 'sk_chairman' AND p.barangay_id IS NOT NULL
    FROM public.profiles p
    WHERE p.id = auth.uid()
  ) AND 
  role = 'kagawad' AND
  (
    barangay_id IS NULL OR 
    barangay_id = (SELECT barangay_id FROM public.profiles WHERE id = auth.uid())
  )
);
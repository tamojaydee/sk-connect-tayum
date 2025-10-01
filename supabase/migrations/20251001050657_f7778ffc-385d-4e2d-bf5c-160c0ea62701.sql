-- Create surveys table to store survey responses
CREATE TABLE public.surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barangay_id uuid NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Profile Information
  full_name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  contact_number text,
  email text,
  address text,
  
  -- Participation Data
  has_participated boolean NOT NULL DEFAULT false,
  participation_type text,
  duration_years integer,
  favorite_activity text,
  impact_description text,
  improvement_suggestions text,
  
  -- Interests
  interested_in_joining boolean NOT NULL DEFAULT false,
  interest_areas text[],
  preferred_activities text[],
  available_time text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- SK chairmen can view surveys from their barangay
CREATE POLICY "SK chairmen can view surveys from their barangay"
ON public.surveys
FOR SELECT
USING (
  (get_user_role() = 'sk_chairman'::user_role AND barangay_id = get_user_barangay_id())
  OR get_user_role() = 'main_admin'::user_role
);

-- Anyone can insert surveys
CREATE POLICY "Anyone can submit surveys"
ON public.surveys
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON public.surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for storing AI-generated survey insights
CREATE TABLE IF NOT EXISTS public.survey_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('overview', 'recommendations')),
  content text NOT NULL,
  survey_month text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.survey_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all survey insights"
  ON public.survey_insights FOR SELECT
  USING (get_user_role() = 'main_admin'::user_role);

CREATE POLICY "SK chairmen can view survey insights"
  ON public.survey_insights FOR SELECT
  USING (get_user_role() = 'sk_chairman'::user_role);

CREATE POLICY "Admins can insert survey insights"
  ON public.survey_insights FOR INSERT
  WITH CHECK (get_user_role() = 'main_admin'::user_role);

CREATE POLICY "SK chairmen can insert survey insights"
  ON public.survey_insights FOR INSERT
  WITH CHECK (get_user_role() = 'sk_chairman'::user_role);

CREATE POLICY "Admins can update survey insights"
  ON public.survey_insights FOR UPDATE
  USING (get_user_role() = 'main_admin'::user_role);

CREATE POLICY "SK chairmen can update survey insights"
  ON public.survey_insights FOR UPDATE
  USING (get_user_role() = 'sk_chairman'::user_role);

-- Create index for faster lookups
CREATE INDEX idx_survey_insights_type_month ON public.survey_insights(report_type, survey_month);

-- Trigger for updated_at
CREATE TRIGGER update_survey_insights_updated_at
  BEFORE UPDATE ON public.survey_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
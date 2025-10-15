-- Add barangay_id column to survey_insights table
ALTER TABLE survey_insights
ADD COLUMN barangay_id UUID REFERENCES barangays(id);

-- Create index for better query performance
CREATE INDEX idx_survey_insights_barangay ON survey_insights(barangay_id);

-- Update RLS policies to consider barangay_id
DROP POLICY IF EXISTS "SK chairmen can view survey insights" ON survey_insights;
DROP POLICY IF EXISTS "SK chairmen can insert survey insights" ON survey_insights;
DROP POLICY IF EXISTS "SK chairmen can update survey insights" ON survey_insights;

CREATE POLICY "SK chairmen can view their barangay survey insights"
ON survey_insights
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'sk_chairman' AND 
  (barangay_id = get_user_barangay_id() OR barangay_id IS NULL)
);

CREATE POLICY "SK chairmen can insert their barangay survey insights"
ON survey_insights
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() = 'sk_chairman' AND 
  (barangay_id = get_user_barangay_id() OR barangay_id IS NULL)
);

CREATE POLICY "SK chairmen can update their barangay survey insights"
ON survey_insights
FOR UPDATE
TO authenticated
USING (
  get_user_role() = 'sk_chairman' AND 
  (barangay_id = get_user_barangay_id() OR barangay_id IS NULL)
);
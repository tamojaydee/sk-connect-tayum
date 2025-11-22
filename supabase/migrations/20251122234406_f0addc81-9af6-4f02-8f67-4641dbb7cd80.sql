-- Add demographic characteristic fields to surveys table
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS civil_status TEXT,
ADD COLUMN IF NOT EXISTS youth_classification TEXT[],
ADD COLUMN IF NOT EXISTS youth_age_group TEXT,
ADD COLUMN IF NOT EXISTS educational_background TEXT,
ADD COLUMN IF NOT EXISTS work_status TEXT,
ADD COLUMN IF NOT EXISTS special_categories TEXT[],
ADD COLUMN IF NOT EXISTS registered_sk_voter BOOLEAN,
ADD COLUMN IF NOT EXISTS registered_national_voter BOOLEAN,
ADD COLUMN IF NOT EXISTS sk_assembly_attended BOOLEAN,
ADD COLUMN IF NOT EXISTS sk_assembly_frequency TEXT,
ADD COLUMN IF NOT EXISTS sk_election_voted BOOLEAN,
ADD COLUMN IF NOT EXISTS sk_election_frequency TEXT,
ADD COLUMN IF NOT EXISTS no_sk_assembly_reason TEXT;
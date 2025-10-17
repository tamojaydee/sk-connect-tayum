-- Add location fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS location_address text,
ADD COLUMN IF NOT EXISTS location_lat numeric,
ADD COLUMN IF NOT EXISTS location_lng numeric;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
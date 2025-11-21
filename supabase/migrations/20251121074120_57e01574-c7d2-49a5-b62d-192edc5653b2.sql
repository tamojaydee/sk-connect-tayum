-- Drop the existing policy that only allows viewing active projects
DROP POLICY IF EXISTS "Anyone can view active projects for transparency" ON projects;

-- Create new policy that allows viewing both active and completed projects
CREATE POLICY "Anyone can view active and completed projects for transparency" 
ON projects 
FOR SELECT 
USING (status IN ('active', 'completed'));
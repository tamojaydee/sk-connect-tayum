-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view active events" ON events;

-- Create new policy that allows viewing both active and completed events
CREATE POLICY "Anyone can view active and completed events"
ON events
FOR SELECT
USING (status IN ('active', 'completed'));
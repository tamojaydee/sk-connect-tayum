-- Allow public viewing of active events
CREATE POLICY "Anyone can view active events"
ON public.events
FOR SELECT
USING (status = 'active');
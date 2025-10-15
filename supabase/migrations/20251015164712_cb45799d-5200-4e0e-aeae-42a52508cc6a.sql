-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  barangay_id uuid REFERENCES public.barangays(id),
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Main admins can view all audit logs
CREATE POLICY "Main admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (get_user_role() = 'main_admin');

-- SK chairmen can view audit logs for their barangay
CREATE POLICY "SK chairmen can view their barangay audit logs"
ON public.audit_logs
FOR SELECT
USING (
  get_user_role() = 'sk_chairman' 
  AND barangay_id = get_user_barangay_id()
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_barangay_id ON public.audit_logs(barangay_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
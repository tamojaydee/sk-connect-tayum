-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  barangay_id UUID NOT NULL REFERENCES public.barangays(id),
  budget NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project photos table
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project comments table
CREATE TABLE public.project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "SK chairmen and main admins can create projects"
ON public.projects FOR INSERT
WITH CHECK (
  (get_user_role() = 'sk_chairman' AND barangay_id = get_user_barangay_id())
  OR get_user_role() = 'main_admin'
);

CREATE POLICY "Users can view projects in their barangay"
ON public.projects FOR SELECT
USING (
  barangay_id = get_user_barangay_id() 
  OR get_user_role() = 'main_admin'
);

CREATE POLICY "Anyone can view active projects for transparency"
ON public.projects FOR SELECT
USING (status = 'active');

CREATE POLICY "Users can update projects they created"
ON public.projects FOR UPDATE
USING (
  (created_by = auth.uid() AND barangay_id = get_user_barangay_id())
  OR get_user_role() = 'main_admin'
);

CREATE POLICY "Users can delete projects they created"
ON public.projects FOR DELETE
USING (
  created_by = auth.uid() 
  OR get_user_role() = 'main_admin'
);

-- RLS Policies for project_photos
CREATE POLICY "Anyone can view project photos"
ON public.project_photos FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can upload photos to projects"
ON public.project_photos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete photos they uploaded"
ON public.project_photos FOR DELETE
USING (uploaded_by = auth.uid() OR get_user_role() = 'main_admin');

-- RLS Policies for project_comments
CREATE POLICY "Anyone can view project comments"
ON public.project_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add comments"
ON public.project_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own comments"
ON public.project_comments FOR DELETE
USING (user_id = auth.uid() OR get_user_role() = 'main_admin');

-- Create storage bucket for project photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project photos
CREATE POLICY "Anyone can view project photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-photos');

CREATE POLICY "Authenticated users can upload project photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own project photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger for updated_at on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add related_project_id to budget_transactions if not exists
ALTER TABLE public.budget_transactions 
ADD COLUMN IF NOT EXISTS related_project_id UUID REFERENCES public.projects(id);

-- Update trigger to handle project budget deductions
CREATE OR REPLACE FUNCTION public.handle_project_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.budget > 0 AND (TG_OP = 'INSERT' OR OLD.budget != NEW.budget) THEN
    -- Check if there's enough budget
    IF (SELECT available_budget FROM barangay_budgets WHERE barangay_id = NEW.barangay_id) < NEW.budget THEN
      RAISE EXCEPTION 'Insufficient budget for this project';
    END IF;
    
    -- Create transaction record
    INSERT INTO budget_transactions (
      barangay_id,
      transaction_type,
      amount,
      description,
      created_by,
      related_project_id
    ) VALUES (
      NEW.barangay_id,
      'deduct',
      NEW.budget,
      'Budget allocation for project: ' || NEW.title,
      NEW.created_by,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_budget_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_budget();

-- Update event budget handling to also create transaction
CREATE OR REPLACE FUNCTION public.handle_event_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.budget > 0 AND (TG_OP = 'INSERT' OR OLD.budget IS NULL OR OLD.budget != NEW.budget) THEN
    -- Check if there's enough budget
    IF (SELECT available_budget FROM barangay_budgets WHERE barangay_id = NEW.barangay_id) < NEW.budget THEN
      RAISE EXCEPTION 'Insufficient budget for this event';
    END IF;
    
    -- Create transaction record
    INSERT INTO budget_transactions (
      barangay_id,
      transaction_type,
      amount,
      description,
      created_by,
      related_event_id
    ) VALUES (
      NEW.barangay_id,
      'deduct',
      NEW.budget,
      'Budget allocation for event: ' || NEW.title,
      NEW.created_by,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER event_budget_trigger
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_budget();
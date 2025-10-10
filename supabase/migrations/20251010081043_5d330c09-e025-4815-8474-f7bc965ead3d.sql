-- Create table for homepage settings
CREATE TABLE IF NOT EXISTS public.homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_background_url text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create table for announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  content text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create table for slideshow images
CREATE TABLE IF NOT EXISTS public.slideshow_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Insert default homepage settings
INSERT INTO public.homepage_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slideshow_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homepage_settings
CREATE POLICY "Anyone can view homepage settings"
  ON public.homepage_settings FOR SELECT
  USING (true);

CREATE POLICY "Main admins can update homepage settings"
  ON public.homepage_settings FOR UPDATE
  USING (get_user_role() = 'main_admin'::user_role);

-- RLS Policies for announcements
CREATE POLICY "Anyone can view active announcements"
  ON public.announcements FOR SELECT
  USING (is_active = true OR get_user_role() = 'main_admin'::user_role);

CREATE POLICY "Main admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (get_user_role() = 'main_admin'::user_role);

CREATE POLICY "Main admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (get_user_role() = 'main_admin'::user_role);

CREATE POLICY "Main admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (get_user_role() = 'main_admin'::user_role);

-- RLS Policies for slideshow_images
CREATE POLICY "Anyone can view active slideshow images"
  ON public.slideshow_images FOR SELECT
  USING (is_active = true OR get_user_role() = 'main_admin'::user_role);

CREATE POLICY "Main admins can insert slideshow images"
  ON public.slideshow_images FOR INSERT
  WITH CHECK (get_user_role() = 'main_admin'::user_role);

CREATE POLICY "Main admins can update slideshow images"
  ON public.slideshow_images FOR UPDATE
  USING (get_user_role() = 'main_admin'::user_role);

CREATE POLICY "Main admins can delete slideshow images"
  ON public.slideshow_images FOR DELETE
  USING (get_user_role() = 'main_admin'::user_role);

-- Create storage bucket for page management
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-management', 'page-management', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for page-management bucket
CREATE POLICY "Anyone can view page management files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'page-management');

CREATE POLICY "Main admins can upload page management files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'page-management' AND get_user_role() = 'main_admin'::user_role);

CREATE POLICY "Main admins can update page management files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'page-management' AND get_user_role() = 'main_admin'::user_role);

CREATE POLICY "Main admins can delete page management files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'page-management' AND get_user_role() = 'main_admin'::user_role);
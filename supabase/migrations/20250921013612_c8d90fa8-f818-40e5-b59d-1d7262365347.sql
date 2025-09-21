-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('main_admin', 'sk_chairman', 'kagawad');

-- Create barangays table
CREATE TABLE public.barangays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the 11 barangays of Tayum, Abra
INSERT INTO public.barangays (name, code) VALUES
  ('Poblacion', 'POB'),
  ('Cabaritan', 'CAB'),
  ('San Isidro', 'SIS'),
  ('Santa Rosa', 'SRO'),
  ('Natubleng', 'NAT'),
  ('Caganayan', 'CAG'),
  ('Pacoc', 'PAC'),
  ('Upper Lacub', 'ULA'),
  ('Lower Lacub', 'LLA'),
  ('Baliling', 'BAL'),
  ('Naguirian', 'NAG');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'kagawad',
  barangay_id UUID REFERENCES public.barangays(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  barangay_id UUID NOT NULL REFERENCES public.barangays(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  document_type TEXT NOT NULL,
  barangay_id UUID NOT NULL REFERENCES public.barangays(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_barangay_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barangay_id FROM public.profiles WHERE id = auth.uid();
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Main admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.get_user_role() = 'main_admin');

CREATE POLICY "SK chairmans can view profiles in their barangay"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.get_user_role() = 'sk_chairman' AND 
  barangay_id = public.get_user_barangay_id()
);

CREATE POLICY "Main admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role() = 'main_admin');

CREATE POLICY "Main admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.get_user_role() = 'main_admin');

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- RLS Policies for barangays
CREATE POLICY "Anyone can view barangays"
ON public.barangays FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for events
CREATE POLICY "Users can view events in their barangay"
ON public.events FOR SELECT
TO authenticated
USING (
  barangay_id = public.get_user_barangay_id() OR
  public.get_user_role() = 'main_admin'
);

CREATE POLICY "SK chairmans and kagawads can create events in their barangay"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  barangay_id = public.get_user_barangay_id() AND
  public.get_user_role() IN ('sk_chairman', 'kagawad')
);

CREATE POLICY "Users can update events they created in their barangay"
ON public.events FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  barangay_id = public.get_user_barangay_id()
);

CREATE POLICY "Main admins can update all events"
ON public.events FOR UPDATE
TO authenticated
USING (public.get_user_role() = 'main_admin');

CREATE POLICY "Users can delete events they created"
ON public.events FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  public.get_user_role() = 'main_admin'
);

-- RLS Policies for documents
CREATE POLICY "Users can view documents in their barangay"
ON public.documents FOR SELECT
TO authenticated
USING (
  barangay_id = public.get_user_barangay_id() OR
  public.get_user_role() = 'main_admin' OR
  is_public = true
);

CREATE POLICY "SK chairmans can create documents in their barangay"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (
  barangay_id = public.get_user_barangay_id() AND
  public.get_user_role() = 'sk_chairman'
);

CREATE POLICY "Users can update documents they created"
ON public.documents FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR
  public.get_user_role() = 'main_admin'
);

CREATE POLICY "Users can delete documents they created"
ON public.documents FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  public.get_user_role() = 'main_admin'
);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'kagawad')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Fix storage policies for avatars bucket to allow SK chairmen to upload
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow SK chairmen to upload avatars for users in their barangay
CREATE POLICY "SK chairmen can upload avatars for their barangay"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    SELECT role = 'sk_chairman' AND barangay_id IS NOT NULL
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Fix profiles table RLS to allow SK chairmen to update kagawad profiles in their barangay
DROP POLICY IF EXISTS "SK chairmen can update kagawad profiles in their barangay" ON public.profiles;

CREATE POLICY "SK chairmen can update kagawad profiles in their barangay"
ON public.profiles FOR UPDATE
USING (
  (
    SELECT p.role = 'sk_chairman' AND p.barangay_id = profiles.barangay_id
    FROM public.profiles p
    WHERE p.id = auth.uid()
  ) AND role = 'kagawad'
);
-- Add missing foreign key constraint for projects.created_by (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'projects_created_by_fkey'
    ) THEN
        ALTER TABLE public.projects
        ADD CONSTRAINT projects_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing foreign key constraints for project_comments table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_comments_user_id_fkey'
    ) THEN
        ALTER TABLE public.project_comments
        ADD CONSTRAINT project_comments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing foreign key constraints for project_photos table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_photos_uploaded_by_fkey'
    ) THEN
        ALTER TABLE public.project_photos
        ADD CONSTRAINT project_photos_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_photos_project_id_fkey'
    ) THEN
        ALTER TABLE public.project_photos
        ADD CONSTRAINT project_photos_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
END $$;
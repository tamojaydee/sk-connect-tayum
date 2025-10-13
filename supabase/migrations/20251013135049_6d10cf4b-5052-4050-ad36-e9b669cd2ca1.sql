-- Create avatars storage bucket if not exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Drop existing avatar policies if they exist
drop policy if exists "Public can view avatars" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

-- Storage policies for avatars bucket
-- Public can read avatars
create policy "Public can view avatars"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Users can upload their own avatar (path starts with their user id)
create policy "Users can upload their own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
create policy "Users can update their own avatar"
on storage.objects
for update
using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects
for delete
using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure auto-archive trigger is attached to events
drop trigger if exists auto_archive_expired_events_trigger on public.events;
create trigger auto_archive_expired_events_trigger
before insert or update on public.events
for each row
execute function public.auto_archive_expired_events();
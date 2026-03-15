-- 1. Add image_url to vehicles table
alter table public.vehicles add column if not exists image_url text;

-- 2. Create the storage bucket for vehicle images
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do nothing;

-- 3. Set up Storage Policies (RLS for Buckets)
-- This allows any authenticated user to upload to the bucket
-- but only into a folder named after their own user_id.

create policy "Users can upload their own vehicle images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vehicle-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own vehicle images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'vehicle-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own vehicle images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'vehicle-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

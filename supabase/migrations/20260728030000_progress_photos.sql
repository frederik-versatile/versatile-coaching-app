-- Phase 3: progress_photos table, RLS, private storage bucket, and storage RLS.
-- Run this in the Supabase SQL editor (or `supabase db push` if the project is linked).

create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  storage_path text not null,
  taken_date date not null,
  created_at timestamptz default now()
);

alter table progress_photos enable row level security;

create policy "clients manage own progress photos"
  on progress_photos for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "coaches read linked clients' progress photos"
  on progress_photos for select
  using (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = progress_photos.client_id
      and coach_clients.coach_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false);

-- Defense-in-depth beyond the app's own client-side validation: even a
-- request that bypasses the app entirely and hits Supabase Storage directly
-- gets rejected here for the wrong type or an oversized file.
update storage.buckets
set file_size_limit = 20971520, -- 20MB, matches the app's own pre-upload check
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'progress-photos';

create policy "clients manage own photo files"
on storage.objects for all
using (
  bucket_id = 'progress-photos'
  and (auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'progress-photos'
  and (auth.uid())::text = (storage.foldername(name))[1]
);

create policy "coaches view linked clients' photo files"
on storage.objects for select
using (
  bucket_id = 'progress-photos'
  and exists (
    select 1 from coach_clients
    where coach_clients.coach_id = auth.uid()
    and coach_clients.client_id::text = (storage.foldername(name))[1]
  )
);

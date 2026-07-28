-- Phase 0: profiles, coach_clients, auto-profile trigger, and RLS.
-- Run this in the Supabase SQL editor (or `supabase db push` if the project is linked).

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('coach','client')),
  full_name text,
  created_at timestamptz default now()
);

create table coach_clients (
  coach_id uuid references profiles(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade,
  primary key (coach_id, client_id)
);

-- Auto-create a profile row whenever someone signs up.
--
-- TEMPORARY (Phase 0 only): `role` is read straight from the signup form's
-- user metadata, so anyone signing up can self-select "coach". That's fine
-- while it's just internal testing, but before real clients sign up, replace
-- this with a coach-invite flow (e.g. role only settable server-side via a
-- trusted invite token) so role assignment is never user-controlled.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;
alter table coach_clients enable row level security;

create policy "users read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "coaches read linked clients' profiles"
  on profiles for select
  using (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = profiles.id
      and coach_clients.coach_id = auth.uid()
    )
  );

create policy "coaches manage their own links"
  on coach_clients for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- Add email to profiles, so coaches can see a client's email after
-- inviting them (auth.users isn't queryable through the normal RLS-scoped
-- client, so without this the email is only ever visible once, in the
-- invite form, and then lost).
--
-- No RLS change needed: the existing profiles policies ("read own profile",
-- "coaches read linked clients' profiles") are row-level, so they already
-- cover this new column for whichever rows they permit.
alter table profiles add column email text;

-- Backfill the two real accounts still around after the test-account
-- cleanup. Not a general backfill loop over auth.users because this project
-- has no other rows left to backfill -- if that changes before this
-- migration runs, add more updates here rather than writing a generic
-- auth.users join (keeps this an explicit, reviewable list of what's being
-- written, consistent with how the rest of this schema's data is handled).
update profiles set email = 'frederik@frederiksaabye.dk' where id = 'eb53c01c-aebd-4af3-bb04-c4202e2905f4';
update profiles set email = 'sara.vlckova97@gmail.com' where id = '680aea6b-4af0-4a42-a39c-c71bf9ee7153';

alter table profiles alter column email set not null;

-- Populate email on every future signup (direct or invite) from auth.users,
-- never from client-editable metadata -- same reasoning as the role fix in
-- 20260728070000_lock_signup_role_to_client.sql: auth.users.email is set by
-- Supabase itself as part of the signup/invite call, not something the
-- signing-up user can freely override the way raw_user_meta_data can be.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    'client',
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

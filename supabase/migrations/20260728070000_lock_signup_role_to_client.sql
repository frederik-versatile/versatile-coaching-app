-- Phase 6 (fix-forward): close the gap the Phase 0 "TEMPORARY" comment on
-- handle_new_user() warned about.
--
-- Removing the app's /signup page only closes the app's own route. Supabase's
-- own public signup endpoint (POST /auth/v1/signup) is still reachable
-- directly with the public anon key, which is intentionally embedded in the
-- client bundle. The old trigger read `role` straight out of that
-- user-supplied metadata (`coalesce(new.raw_user_meta_data->>'role',
-- 'client')`), so anyone could call the endpoint directly and self-assign
-- role='coach', bypassing the app entirely. Verified: a direct signup call
-- with data: { role: "coach" } returned 200 and would have produced a
-- profiles row with role='coach'.
--
-- Fix: never trust client-supplied metadata for role. Every new signup
-- (whichever path creates the auth.users row) gets role='client',
-- unconditionally. This doesn't change any legitimate flow: the coach-invite
-- Server Action already explicitly requests role: 'client' in the metadata
-- it sends, so its behavior is unaffected. There is no in-app coach
-- self-signup today — coach accounts (Carl, Dana) were provisioned directly
-- in the database, and any future coach account would be provisioned the
-- same way, not through this trigger.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'client',
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

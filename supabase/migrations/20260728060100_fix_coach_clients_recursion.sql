-- Phase 6 (fix-forward): the previous migration's coach_clients policy
-- caused "infinite recursion detected in policy for relation coach_clients".
--
-- Why: the new with-check queried `profiles` to confirm the caller's role.
-- But `profiles` has its own RLS policy ("coaches read linked clients'
-- profiles") that queries `coach_clients` right back — so checking the
-- coach_clients policy required evaluating the profiles policy, which
-- required evaluating the coach_clients policy again, and so on.
--
-- The fix is a small SECURITY DEFINER helper function. This is the one
-- place in this schema where SECURITY DEFINER is actually correct, not a
-- trap: it returns a single boolean fact about the caller's own profile
-- (never other rows, never arbitrary data), so it can't leak anything, and
-- bypassing RLS internally is exactly what breaks the cycle. Contrast with
-- the Phase 4 daily_volume view, where SECURITY DEFINER (or a plain view's
-- default owner-privilege behavior) would have been wrong because it bypassed
-- RLS on the actual rows being returned to the caller.
--
-- Also note: this checks the profiles.role column specifically, not JWT
-- user_metadata — auth user_metadata is editable by users themselves via
-- supabase.auth.updateUser(), so trusting it here would let anyone grant
-- themselves "coach" just by editing their own metadata. profiles.role has
-- no user-facing update path at all (only the Phase 0 trigger writes it),
-- which is what makes it trustworthy for this check.
create or replace function public.is_coach(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = uid and role = 'coach'
  );
$$;

drop policy "coaches manage their own links" on coach_clients;

create policy "coaches manage their own links"
  on coach_clients for all
  using (coach_id = auth.uid())
  with check (
    coach_id = auth.uid()
    and public.is_coach(auth.uid())
  );

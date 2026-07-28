-- Phase 7 (I): record when a user accepts the privacy policy, and let users
-- update their own profile row so the invite-acceptance flow can write that
-- timestamp (there was previously no UPDATE policy on profiles at all).
alter table profiles add column privacy_accepted_at timestamptz;

-- A broad "update your own row" policy is fine for full_name/email/
-- privacy_accepted_at (worst case a user gives themselves a silly display
-- name), but role must never change after creation -- that's the exact
-- invariant the Phase 6 signup-role fix depends on. Enforcing it with a
-- trigger (rather than trying to carve role out of the RLS check) means it
-- holds no matter what updates this table, including any future service-role
-- code path, not just this one policy.
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    raise exception 'profiles.role cannot be changed after creation';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger profiles_role_immutable
  before update on profiles
  for each row execute function public.prevent_role_change();

create policy "users update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

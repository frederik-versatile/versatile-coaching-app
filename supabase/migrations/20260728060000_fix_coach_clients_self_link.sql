-- Phase 6: close a pre-existing hole in coach_clients RLS.
--
-- The original Phase 0 policy only checked coach_id = auth.uid(), which is
-- trivially true for anyone inserting their own id as coach_id — it never
-- verified the caller's profiles.role was actually 'coach', nor restricted
-- which client_id they could target. That meant ANY authenticated user
-- (client or coach) could self-insert a coach_clients row naming themselves
-- as coach for any other client, and immediately inherit read access to
-- that client's entire data set via every "coaches read linked clients'..."
-- policy across the schema (profiles, weekly_plans, workouts, exercises,
-- workout_logs, exercise_logs, weight_logs, progress_photos + storage,
-- macro_splits, meal_plans). Verified empirically before this fix: a plain
-- client account inserted one row and immediately read another client's
-- weight_logs and macro_splits.
--
-- This tightens the check so only a user whose own profile.role is 'coach'
-- can create or modify coach_clients rows naming themselves as coach.
drop policy "coaches manage their own links" on coach_clients;

create policy "coaches manage their own links"
  on coach_clients for all
  using (coach_id = auth.uid())
  with check (
    coach_id = auth.uid()
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
    )
  );

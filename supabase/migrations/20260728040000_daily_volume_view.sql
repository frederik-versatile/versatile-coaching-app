-- Phase 4: daily_volume view for the training-volume trend chart.
-- Run this in the Supabase SQL editor (or `supabase db push` if the project is linked).
--
-- IMPORTANT: `security_invoker = true` is required here, not optional.
-- Postgres's default view behavior is the OPPOSITE of "inherits RLS for the
-- querying user": a plain view runs with the privileges of whoever created
-- it (the view owner), and RLS policies are evaluated against that owner's
-- identity. Since views get created via the Supabase SQL editor (running as
-- a superuser), a plain view here would bypass RLS entirely for every
-- caller, regardless of their session — verified empirically: without
-- security_invoker, querying this view with nothing but the public anon key
-- (no login) returned every client's rows. `security_invoker = true` (a
-- Postgres 15+ option) is what makes the view evaluate permissions and RLS
-- as the actual querying user, which is what actually makes the
-- client-owns/coach-reads rules from Phase 2 apply here. A security-definer
-- function would make this worse, not better — same reasoning, opposite
-- direction, which is why the brief calls that out too.
create view daily_volume
with (security_invoker = true)
as
select
  wl.client_id,
  wl.log_date,
  sum(el.reps * el.weight_kg) as volume_kg
from workout_logs wl
join exercise_logs el on el.workout_log_id = wl.id
group by wl.client_id, wl.log_date;

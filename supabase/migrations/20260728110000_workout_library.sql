-- Reusable workout library: coach-owned templates, independent of any
-- specific client/week. Scheduling a template onto a day/slot copies its
-- exercises into new workouts/exercises rows (see scheduleTemplate action) --
-- workout_logs/exercise_logs already reference workouts.id/exercises.id
-- directly, so a live-reference model would risk retroactively changing
-- already-logged history if a template was edited later. source_template_id
-- below is provenance only, never read at scheduling time after creation.

create table workout_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade,
  name text not null,
  workout_type text not null check (workout_type in ('strength','run','bike','mobility','recovery')),
  notes text,
  created_at timestamptz default now()
);

create table template_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid references workout_templates(id) on delete cascade,
  name text not null,
  target_sets int,
  target_reps text,
  target_weight_kg numeric,
  target_rir int,
  target_rest_seconds int,
  target_duration_minutes numeric,
  target_distance_km numeric,
  target_pace text,          -- free text, e.g. "5:30/km" -- same free-text pattern as target_reps for ranges
  notes text,
  sort_order int default 0
);

alter table workouts add column time_slot text not null default 'am' check (time_slot in ('am','midday','pm'));
alter table workouts add column workout_type text not null default 'strength' check (workout_type in ('strength','run','bike','mobility','recovery'));
alter table workouts add column source_template_id uuid references workout_templates(id) on delete set null;

alter table exercises add column target_duration_minutes numeric;
alter table exercises add column target_distance_km numeric;
alter table exercises add column target_pace text;

alter table workout_templates enable row level security;
alter table template_exercises enable row level security;

-- Coach-owned, no client access at all -- clients never see the library,
-- only the copies scheduled onto their own weekly plans.
create policy "coaches manage their own workout templates"
  on workout_templates for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coaches manage their own template exercises"
  on template_exercises for all
  using (
    exists (
      select 1 from workout_templates
      where workout_templates.id = template_exercises.workout_template_id
      and workout_templates.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_templates
      where workout_templates.id = template_exercises.workout_template_id
      and workout_templates.coach_id = auth.uid()
    )
  );

-- Phase 1: weekly_plans, workouts, exercises, and RLS.
-- Run this in the Supabase SQL editor (or `supabase db push` if the project is linked).

create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  week_start date not null,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid references weekly_plans(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Mon .. 6=Sun
  name text not null,
  sort_order int default 0
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade,
  name text not null,
  target_sets int,
  target_reps text,        -- e.g. "8-10"
  target_weight_kg numeric,
  notes text,
  sort_order int default 0
);

alter table weekly_plans enable row level security;
alter table workouts enable row level security;
alter table exercises enable row level security;

-- weekly_plans: coach can do everything for their own linked clients; client can only read their own
create policy "coaches manage their clients' weekly plans"
  on weekly_plans for all
  using (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = weekly_plans.client_id
      and coach_clients.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = weekly_plans.client_id
      and coach_clients.coach_id = auth.uid()
    )
  );

create policy "clients read own weekly plans"
  on weekly_plans for select
  using (client_id = auth.uid());

-- workouts: same pattern, one join deeper (via weekly_plans)
create policy "coaches manage workouts for their clients"
  on workouts for all
  using (
    exists (
      select 1 from weekly_plans
      join coach_clients on coach_clients.client_id = weekly_plans.client_id
      where weekly_plans.id = workouts.weekly_plan_id
      and coach_clients.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from weekly_plans
      join coach_clients on coach_clients.client_id = weekly_plans.client_id
      where weekly_plans.id = workouts.weekly_plan_id
      and coach_clients.coach_id = auth.uid()
    )
  );

create policy "clients read own workouts"
  on workouts for select
  using (
    exists (
      select 1 from weekly_plans
      where weekly_plans.id = workouts.weekly_plan_id
      and weekly_plans.client_id = auth.uid()
    )
  );

-- exercises: same pattern, two joins deep (via workouts -> weekly_plans)
create policy "coaches manage exercises for their clients"
  on exercises for all
  using (
    exists (
      select 1 from workouts
      join weekly_plans on weekly_plans.id = workouts.weekly_plan_id
      join coach_clients on coach_clients.client_id = weekly_plans.client_id
      where workouts.id = exercises.workout_id
      and coach_clients.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts
      join weekly_plans on weekly_plans.id = workouts.weekly_plan_id
      join coach_clients on coach_clients.client_id = weekly_plans.client_id
      where workouts.id = exercises.workout_id
      and coach_clients.coach_id = auth.uid()
    )
  );

create policy "clients read own exercises"
  on exercises for select
  using (
    exists (
      select 1 from workouts
      join weekly_plans on weekly_plans.id = workouts.weekly_plan_id
      where workouts.id = exercises.workout_id
      and weekly_plans.client_id = auth.uid()
    )
  );

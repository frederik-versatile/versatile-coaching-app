-- Phase 2: workout_logs, exercise_logs, weight_logs, and RLS.
-- Run this in the Supabase SQL editor (or `supabase db push` if the project is linked).

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade,
  log_date date not null,
  status text check (status in ('completed','skipped')) not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workout_id, log_date)
);

create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid references workout_logs(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  set_number int not null,
  reps int,
  weight_kg numeric,
  created_at timestamptz default now()
);

create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  log_date date not null,
  weight_kg numeric not null,
  created_at timestamptz default now(),
  unique(client_id, log_date)
);

alter table workout_logs enable row level security;
alter table exercise_logs enable row level security;
alter table weight_logs enable row level security;

-- workout_logs: client owns their own; coach can read (not write) via coach_clients
create policy "clients manage own workout logs"
  on workout_logs for all
  using (client_id = auth.uid())
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from workouts
      join weekly_plans on weekly_plans.id = workouts.weekly_plan_id
      where workouts.id = workout_logs.workout_id
      and weekly_plans.client_id = auth.uid()
    )
  );

create policy "coaches read linked clients' workout logs"
  on workout_logs for select
  using (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = workout_logs.client_id
      and coach_clients.coach_id = auth.uid()
    )
  );

-- exercise_logs: ownership flows through workout_logs
create policy "clients manage own exercise logs"
  on exercise_logs for all
  using (
    exists (
      select 1 from workout_logs
      where workout_logs.id = exercise_logs.workout_log_id
      and workout_logs.client_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_logs
      where workout_logs.id = exercise_logs.workout_log_id
      and workout_logs.client_id = auth.uid()
    )
  );

create policy "coaches read linked clients' exercise logs"
  on exercise_logs for select
  using (
    exists (
      select 1 from workout_logs
      join coach_clients on coach_clients.client_id = workout_logs.client_id
      where workout_logs.id = exercise_logs.workout_log_id
      and coach_clients.coach_id = auth.uid()
    )
  );

-- weight_logs: same client-owns, coach-reads pattern
create policy "clients manage own weight logs"
  on weight_logs for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "coaches read linked clients' weight logs"
  on weight_logs for select
  using (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = weight_logs.client_id
      and coach_clients.coach_id = auth.uid()
    )
  );

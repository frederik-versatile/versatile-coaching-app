-- Phase 5: macro_splits, meal_plans, and RLS.
-- Run this in the Supabase SQL editor (or `supabase db push` if the project is linked).

create table macro_splits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  effective_date date not null,
  calories int,
  protein_g int,
  carbs_g int,
  fat_g int,
  set_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  effective_date date not null,
  content jsonb not null,
  set_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table macro_splits enable row level security;
alter table meal_plans enable row level security;

create policy "coaches manage their clients' macro splits"
  on macro_splits for all
  using (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = macro_splits.client_id
      and coach_clients.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = macro_splits.client_id
      and coach_clients.coach_id = auth.uid()
    )
  );

create policy "clients read own macro splits"
  on macro_splits for select
  using (client_id = auth.uid());

create policy "coaches manage their clients' meal plans"
  on meal_plans for all
  using (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = meal_plans.client_id
      and coach_clients.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = meal_plans.client_id
      and coach_clients.coach_id = auth.uid()
    )
  );

create policy "clients read own meal plans"
  on meal_plans for select
  using (client_id = auth.uid());

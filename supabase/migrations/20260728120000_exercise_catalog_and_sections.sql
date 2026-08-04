-- Reusable exercise catalog + named sections for the Library workout builder.
-- Sections are Library-only: scheduleTemplate still copies a template's
-- exercises into a flat exercises list, unchanged.

create table exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table template_sections (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid references workout_templates(id) on delete cascade,
  name text not null,
  sort_order int default 0
);

-- workout_template_id stays on template_exercises (keeps the existing RLS
-- policy untouched); section_id is an additional, required grouping.
-- Safe as NOT NULL with no backfill: template_exercises is currently empty.
alter table template_exercises add column section_id uuid references template_sections(id) on delete cascade not null;

alter table exercise_catalog enable row level security;
alter table template_sections enable row level security;

create policy "coaches manage their own exercise catalog"
  on exercise_catalog for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coaches manage their own template sections"
  on template_sections for all
  using (
    exists (
      select 1 from workout_templates
      where workout_templates.id = template_sections.workout_template_id
      and workout_templates.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_templates
      where workout_templates.id = template_sections.workout_template_id
      and workout_templates.coach_id = auth.uid()
    )
  );

-- Adds "Functional Training" as a 6th fixed workout type, and a free-text
-- sub-tag on workout_templates for finer-grained, coach-defined filtering
-- (e.g. "Push", "Pull", "Legs") on top of the fixed type. Tags are
-- Library-only, same as sections -- they don't carry onto scheduled
-- workouts, since filtering only happens in the Library/sidebar views.

alter table workout_templates drop constraint workout_templates_workout_type_check;
alter table workout_templates add constraint workout_templates_workout_type_check
  check (workout_type in ('strength','functional','run','bike','mobility','recovery'));

alter table workouts drop constraint workouts_workout_type_check;
alter table workouts add constraint workouts_workout_type_check
  check (workout_type in ('strength','functional','run','bike','mobility','recovery'));

alter table workout_templates add column tag text;

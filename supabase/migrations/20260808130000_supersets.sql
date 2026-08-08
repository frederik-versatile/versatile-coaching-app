-- Supersets: exercises within the same section that share a superset_group
-- value are grouped and shown together (labeled A1/A2, B1/B2, ...). The
-- group id is just a shared opaque value, not a row in another table --
-- built and dissolved entirely by the drag-to-merge / ungroup actions.
-- Library-only, same as sections and tags: scheduleTemplate keeps copying
-- a flat exercise list, nothing changes on the workouts/exercises side.

alter table template_exercises add column superset_group uuid;

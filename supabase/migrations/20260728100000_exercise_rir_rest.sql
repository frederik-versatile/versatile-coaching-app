-- Add RIR (reps in reserve) and rest time targets to exercises.
alter table exercises add column target_rir int;
alter table exercises add column target_rest_seconds int;

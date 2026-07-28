export type Exercise = {
  id: string;
  name: string;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  target_rest_seconds: number | null;
  notes: string | null;
  sort_order: number;
};

export type Workout = {
  id: string;
  day_of_week: number;
  name: string;
  sort_order: number;
  exercises: Exercise[];
};

export type Plan = {
  id: string;
  week_start: string;
  notes: string | null;
  workouts: Workout[];
};

export type ExerciseLog = {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
};

export type WorkoutLog = {
  id: string;
  workout_id: string;
  log_date: string;
  status: "completed" | "skipped";
  notes: string | null;
  exercise_logs: ExerciseLog[];
};

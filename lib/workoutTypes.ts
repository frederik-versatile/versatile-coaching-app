// Single source of truth for the fixed workout-type set and which target
// fields each type shows. No "use client" -- imported from both server
// components (data fetching) and client components (form rendering).
export type WorkoutType = "strength" | "functional" | "run" | "bike" | "mobility" | "recovery";

export const WORKOUT_TYPES: WorkoutType[] = [
  "strength",
  "functional",
  "run",
  "bike",
  "mobility",
  "recovery",
];

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: "Strength",
  functional: "Functional Training",
  run: "Run",
  bike: "Bike",
  mobility: "Mobility",
  recovery: "Recovery",
};

// Distinct-but-muted colors per type, drawn from the existing palette
// (accent/success/warning/charcoal/neutral) rather than introducing new
// hues -- keeps type tags visually consistent with the rest of the app.
// Only 3 real hues exist, so the lower-intensity types (functional/
// mobility/recovery) share the same muted treatment.
export const WORKOUT_TYPE_COLOR: Record<WorkoutType, string> = {
  strength: "text-warning bg-warning/10",
  functional: "text-charcoal bg-neutral/20",
  run: "text-success bg-success/10",
  bike: "text-accent bg-accent/10",
  mobility: "text-charcoal bg-neutral/20",
  recovery: "text-charcoal bg-neutral/20",
};

export type ExerciseField =
  | "target_sets"
  | "target_reps"
  | "target_weight_kg"
  | "target_rir"
  | "target_rest_seconds"
  | "target_duration_minutes"
  | "target_distance_km"
  | "target_pace";

// Which fields make sense to show/collect for each workout type. Strength
// keeps the original sets/reps/weight/RIR/rest set; functional adds a
// duration on top of that (circuits are often timed); cardio types (run/
// bike) swap to duration/distance/pace; mobility/recovery only need
// duration (a session length), everything else stays free-text notes.
export const FIELDS_BY_TYPE: Record<WorkoutType, ExerciseField[]> = {
  strength: [
    "target_sets",
    "target_reps",
    "target_weight_kg",
    "target_rir",
    "target_rest_seconds",
  ],
  functional: [
    "target_sets",
    "target_reps",
    "target_weight_kg",
    "target_rir",
    "target_rest_seconds",
    "target_duration_minutes",
  ],
  run: ["target_duration_minutes", "target_distance_km", "target_pace"],
  bike: ["target_duration_minutes", "target_distance_km", "target_pace"],
  mobility: ["target_duration_minutes"],
  recovery: ["target_duration_minutes"],
};

export const FIELD_LABEL: Record<ExerciseField, string> = {
  target_sets: "Sets",
  target_reps: "Reps",
  target_weight_kg: "Weight (kg)",
  target_rir: "RIR",
  target_rest_seconds: "Rest (sec)",
  target_duration_minutes: "Duration (min)",
  target_distance_km: "Distance (km)",
  target_pace: "Pace",
};

export type TargetValues = Partial<Record<ExerciseField, number | string | null>>;

// Builds the "4 sets · 8-10 reps · 60 kg" style summary line for whichever
// fields a given type actually uses, instead of every exercise summary
// hardcoding the strength-only field list.
export function summarizeTargets(type: WorkoutType, values: TargetValues): string {
  const parts = FIELDS_BY_TYPE[type]
    .map((field) => {
      const value = values[field];
      if (value === null || value === undefined || value === "") return null;
      switch (field) {
        case "target_sets":
          return `${value} sets`;
        case "target_reps":
          return `${value} reps`;
        case "target_weight_kg":
          return `${value} kg`;
        case "target_rir":
          return `RIR ${value}`;
        case "target_rest_seconds":
          return `${value}s rest`;
        case "target_duration_minutes":
          return `${value} min`;
        case "target_distance_km":
          return `${value} km`;
        case "target_pace":
          return `${value} pace`;
        default:
          return null;
      }
    })
    .filter((v): v is string => Boolean(v));
  return parts.length > 0 ? parts.join("  ·  ") : "No targets set";
}

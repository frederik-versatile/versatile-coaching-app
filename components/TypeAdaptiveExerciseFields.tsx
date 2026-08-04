"use client";

import {
  FIELDS_BY_TYPE,
  FIELD_LABEL,
  type ExerciseField,
  type TargetValues,
  type WorkoutType,
} from "@/lib/workoutTypes";

const NUMERIC_FIELDS: ExerciseField[] = [
  "target_sets",
  "target_weight_kg",
  "target_rir",
  "target_rest_seconds",
  "target_duration_minutes",
  "target_distance_km",
];

const STEP: Partial<Record<ExerciseField, string>> = {
  target_weight_kg: "0.5",
  target_rest_seconds: "5",
  target_duration_minutes: "1",
  target_distance_km: "0.1",
};

// Tailwind's compiler only picks up class names it can find as literal
// strings in source -- a template-literal-built class like
// `sm:grid-cols-${n}` is invisible to it and silently produces no CSS.
// Every count actually used (1, 3, 5) is spelled out here instead.
const GRID_COLS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  3: "grid-cols-2 sm:grid-cols-3",
  5: "grid-cols-2 sm:grid-cols-5",
};

// Renders the right labeled/mono target fields for a workout type -- Strength
// keeps Sets/Reps/Weight/RIR/Rest, Run/Bike swap to Duration/Distance/Pace,
// Mobility/Recovery only need Duration. One shared component so the Library
// template editor and the scheduled-instance editor never drift apart.
export default function TypeAdaptiveExerciseFields({
  workoutType,
  defaultValues,
}: {
  workoutType: WorkoutType;
  defaultValues?: TargetValues;
}) {
  const fields = FIELDS_BY_TYPE[workoutType];
  const gridColsClass = GRID_COLS_CLASS[fields.length] ?? "grid-cols-2 sm:grid-cols-5";

  return (
    <div className={`grid gap-3 ${gridColsClass}`}>
      {fields.map((field) => {
        const isNumeric = NUMERIC_FIELDS.includes(field);
        const value = defaultValues?.[field];
        return (
          <div key={field} className="space-y-1">
            <label className="block text-caption text-charcoal">
              {FIELD_LABEL[field]}
            </label>
            <input
              name={field}
              type={isNumeric ? "number" : "text"}
              min={isNumeric ? 0 : undefined}
              step={STEP[field]}
              defaultValue={value ?? ""}
              placeholder={field === "target_reps" ? "e.g. 8-10" : field === "target_pace" ? "e.g. 5:30/km" : undefined}
              className="w-full rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
            />
          </div>
        );
      })}
    </div>
  );
}

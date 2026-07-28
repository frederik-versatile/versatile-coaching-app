"use client";

import { useState } from "react";
import { logWorkoutCompleted } from "./actions";
import { parseLeadingInt } from "@/lib/days";
import type { Workout, WorkoutLog } from "./types";

type SetRow = { reps: string; weightKg: string };

function initialSets(workout: Workout, existingLog: WorkoutLog | null) {
  const sets: Record<string, SetRow[]> = {};

  for (const exercise of workout.exercises) {
    if (existingLog) {
      const rows = existingLog.exercise_logs
        .filter((l) => l.exercise_id === exercise.id)
        .sort((a, b) => a.set_number - b.set_number)
        .map((l) => ({
          reps: l.reps?.toString() ?? "",
          weightKg: l.weight_kg?.toString() ?? "",
        }));
      sets[exercise.id] = rows.length > 0 ? rows : [{ reps: "", weightKg: "" }];
    } else {
      const count = exercise.target_sets || 1;
      const defaultReps = parseLeadingInt(exercise.target_reps);
      sets[exercise.id] = Array.from({ length: count }, () => ({
        reps: defaultReps?.toString() ?? "",
        weightKg: exercise.target_weight_kg?.toString() ?? "",
      }));
    }
  }

  return sets;
}

export default function WorkoutLogForm({
  workout,
  existingLog,
  onDone,
}: {
  workout: Workout;
  existingLog: WorkoutLog | null;
  onDone: () => void;
}) {
  const [sets, setSets] = useState<Record<string, SetRow[]>>(() =>
    initialSets(workout, existingLog)
  );
  const [notes, setNotes] = useState(existingLog?.notes || "");
  const [saving, setSaving] = useState(false);

  function updateSet(
    exerciseId: string,
    index: number,
    field: keyof SetRow,
    value: string
  ) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  function addSet(exerciseId: string) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), { reps: "", weightKg: "" }],
    }));
  }

  function removeSet(exerciseId: string, index: number) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    const payloadSets = Object.entries(sets).flatMap(([exerciseId, rows]) =>
      rows.map((row, i) => ({
        exerciseId,
        setNumber: i + 1,
        reps: row.reps === "" ? null : Number(row.reps),
        weightKg: row.weightKg === "" ? null : Number(row.weightKg),
      }))
    );

    await logWorkoutCompleted({
      workoutId: workout.id,
      notes: notes || null,
      sets: payloadSets,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="space-y-4 rounded border border-accent bg-white p-3">
      {workout.exercises.map((exercise) => (
        <div key={exercise.id} className="space-y-2">
          <p className="text-body-sm font-medium text-ink">{exercise.name}</p>
          <div className="space-y-1">
            {(sets[exercise.id] || []).map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 font-mono text-data tabular-nums text-charcoal">
                  Set {i + 1}
                </span>
                <input
                  type="number"
                  value={row.reps}
                  onChange={(e) =>
                    updateSet(exercise.id, i, "reps", e.target.value)
                  }
                  placeholder="Reps"
                  className="w-20 rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
                />
                <input
                  type="number"
                  step="0.5"
                  value={row.weightKg}
                  onChange={(e) =>
                    updateSet(exercise.id, i, "weightKg", e.target.value)
                  }
                  placeholder="Weight (kg)"
                  className="w-28 rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => removeSet(exercise.id, i)}
                  className="text-caption text-warning hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addSet(exercise.id)}
            className="text-caption text-accent hover:underline"
          >
            + Add set
          </button>
        </div>
      ))}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save log"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

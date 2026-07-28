"use client";

import { useState } from "react";
import { updateExercise, deleteExercise } from "./actions";

type Exercise = {
  id: string;
  name: string;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  notes: string | null;
};

export default function ExerciseRow({
  exercise,
  clientId,
  planId,
}: {
  exercise: Exercise;
  clientId: string;
  planId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form
        action={async (formData) => {
          await updateExercise(formData);
          setIsEditing(false);
        }}
        className="space-y-3 rounded border border-accent bg-background p-3"
      >
        <input type="hidden" name="client_id" value={clientId} />
        <input type="hidden" name="plan_id" value={planId} />
        <input type="hidden" name="exercise_id" value={exercise.id} />

        <div className="space-y-1">
          <label className="block text-caption text-charcoal">Exercise name</label>
          <input
            name="name"
            defaultValue={exercise.name}
            required
            className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Sets</label>
            <input
              name="target_sets"
              type="number"
              min={0}
              defaultValue={exercise.target_sets ?? ""}
              className="w-full rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Reps</label>
            <input
              name="target_reps"
              defaultValue={exercise.target_reps ?? ""}
              placeholder="e.g. 8-10"
              className="w-full rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Weight (kg)</label>
            <input
              name="target_weight_kg"
              type="number"
              step="0.5"
              min={0}
              defaultValue={exercise.target_weight_kg ?? ""}
              className="w-full rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-caption text-charcoal">Notes (optional)</label>
          <textarea
            name="notes"
            defaultValue={exercise.notes ?? ""}
            rows={1}
            className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded border border-neutral bg-white px-3 py-2">
      <div>
        <p className="text-body-sm font-medium text-ink">{exercise.name}</p>
        <p className="font-mono text-data tabular-nums text-charcoal">
          {[
            exercise.target_sets ? `${exercise.target_sets} sets` : null,
            exercise.target_reps ? `${exercise.target_reps} reps` : null,
            exercise.target_weight_kg ? `${exercise.target_weight_kg} kg` : null,
          ]
            .filter(Boolean)
            .join("  ·  ") || "No targets set"}
        </p>
        {exercise.notes && (
          <p className="mt-1 text-caption text-charcoal">{exercise.notes}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-caption text-accent hover:underline"
        >
          Edit
        </button>
        <form
          action={deleteExercise}
          onSubmit={(e) => {
            if (!confirm(`Delete "${exercise.name}"?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="plan_id" value={planId} />
          <input type="hidden" name="exercise_id" value={exercise.id} />
          <button type="submit" className="text-caption text-warning hover:underline">
            Delete exercise
          </button>
        </form>
      </div>
    </div>
  );
}

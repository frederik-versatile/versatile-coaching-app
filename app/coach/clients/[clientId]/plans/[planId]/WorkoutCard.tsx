"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/lib/days";
import { updateWorkout, deleteWorkout, createExercise } from "./actions";
import ExerciseRow from "./ExerciseRow";

type Exercise = {
  id: string;
  name: string;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  target_rest_seconds: number | null;
  notes: string | null;
};

type Workout = {
  id: string;
  day_of_week: number;
  name: string;
  exercises: Exercise[];
};

export default function WorkoutCard({
  workout,
  clientId,
  planId,
}: {
  workout: Workout;
  clientId: string;
  planId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  return (
    <div className="space-y-3 rounded border border-neutral bg-white p-4">
      {isEditing ? (
        <form
          action={async (formData) => {
            await updateWorkout(formData);
            setIsEditing(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="plan_id" value={planId} />
          <input type="hidden" name="workout_id" value={workout.id} />

          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Workout name</label>
            <input
              name="name"
              defaultValue={workout.name}
              required
              className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Day</label>
            <select
              name="day_of_week"
              defaultValue={workout.day_of_week}
              className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
            >
              {DAY_LABELS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
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
      ) : (
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-display-sm text-ink">{workout.name}</h3>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-caption text-accent hover:underline"
            >
              Edit
            </button>
            <form
              action={deleteWorkout}
              onSubmit={(e) => {
                if (
                  !confirm(
                    `Delete "${workout.name}" and all its exercises?`
                  )
                )
                  e.preventDefault();
              }}
            >
              <input type="hidden" name="client_id" value={clientId} />
              <input type="hidden" name="plan_id" value={planId} />
              <input type="hidden" name="workout_id" value={workout.id} />
              <button type="submit" className="text-caption text-warning hover:underline">
                Delete workout
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {workout.exercises.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            clientId={clientId}
            planId={planId}
          />
        ))}
      </div>

      {showAddExercise ? (
        <form
          action={async (formData) => {
            await createExercise(formData);
            setShowAddExercise(false);
          }}
          className="space-y-3 rounded border border-dashed border-neutral p-3"
        >
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="plan_id" value={planId} />
          <input type="hidden" name="workout_id" value={workout.id} />

          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Exercise name</label>
            <input
              name="name"
              required
              className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="space-y-1">
              <label className="block text-caption text-charcoal">Sets</label>
              <input
                name="target_sets"
                type="number"
                min={0}
                className="w-full rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-caption text-charcoal">Reps</label>
              <input
                name="target_reps"
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
                className="w-full rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-caption text-charcoal">RIR</label>
              <input
                name="target_rir"
                type="number"
                min={0}
                className="w-full rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-caption text-charcoal">Rest (sec)</label>
              <input
                name="target_rest_seconds"
                type="number"
                min={0}
                step="5"
                className="w-full rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Notes (optional)</label>
            <textarea
              name="notes"
              rows={1}
              className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Add exercise
            </button>
            <button
              type="button"
              onClick={() => setShowAddExercise(false)}
              className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddExercise(true)}
          className="text-body-sm text-accent hover:underline"
        >
          + Add exercise
        </button>
      )}
    </div>
  );
}

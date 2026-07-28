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
    <div className="space-y-2 rounded-lg border border-neutral bg-white p-3">
      {isEditing ? (
        <form
          action={async (formData) => {
            await updateWorkout(formData);
            setIsEditing(false);
          }}
          className="space-y-2"
        >
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="plan_id" value={planId} />
          <input type="hidden" name="workout_id" value={workout.id} />

          <input
            name="name"
            defaultValue={workout.name}
            required
            className="w-full rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
          />
          <select
            name="day_of_week"
            defaultValue={workout.day_of_week}
            className="w-full rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
          >
            {DAY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-white hover:opacity-90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-neutral px-3 py-1 text-sm text-ink hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-ink">{workout.name}</h3>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-accent hover:underline"
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
              <button type="submit" className="text-xs text-red-700 hover:underline">
                Delete
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
          className="space-y-2 rounded-md border border-dashed border-neutral p-3"
        >
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="plan_id" value={planId} />
          <input type="hidden" name="workout_id" value={workout.id} />

          <input
            name="name"
            required
            placeholder="Exercise name"
            className="w-full rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              name="target_sets"
              type="number"
              min={0}
              placeholder="Sets"
              className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
            />
            <input
              name="target_reps"
              placeholder="Reps (e.g. 8-10)"
              className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
            />
            <input
              name="target_weight_kg"
              type="number"
              step="0.5"
              min={0}
              placeholder="Weight (kg)"
              className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <textarea
            name="notes"
            placeholder="Notes"
            rows={1}
            className="w-full rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-white hover:opacity-90"
            >
              Add exercise
            </button>
            <button
              type="button"
              onClick={() => setShowAddExercise(false)}
              className="rounded-md border border-neutral px-3 py-1 text-sm text-ink hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddExercise(true)}
          className="text-sm text-accent hover:underline"
        >
          + Add exercise
        </button>
      )}
    </div>
  );
}

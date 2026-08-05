"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TypeAdaptiveExerciseFields from "@/components/TypeAdaptiveExerciseFields";
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLOR, summarizeTargets, type WorkoutType } from "@/lib/workoutTypes";
import { updateWorkout, deleteWorkout, createExercise, updateExercise, deleteExercise } from "../../actions";

type Exercise = {
  id: string;
  name: string;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  target_rest_seconds: number | null;
  target_duration_minutes: number | null;
  target_distance_km: number | null;
  target_pace: string | null;
  notes: string | null;
};

type Workout = {
  id: string;
  name: string;
  workout_type: WorkoutType;
  exercises: Exercise[];
};

function WorkoutHeader({
  clientId,
  planId,
  workout,
}: {
  clientId: string;
  planId: string;
  workout: Workout;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="space-y-3 rounded border border-neutral bg-white p-4">
      {renaming ? (
        <form
          action={async (formData) => {
            formData.set("client_id", clientId);
            formData.set("workout_id", workout.id);
            await updateWorkout(formData);
            setRenaming(false);
          }}
          className="flex gap-2"
        >
          <input
            name="name"
            defaultValue={workout.name}
            required
            autoFocus
            className="flex-1 rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
          />
          <button
            type="submit"
            className="rounded bg-accent px-4 py-2 text-body-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setRenaming(false)}
            className="rounded border border-neutral px-4 py-2 text-body-sm text-ink transition-colors hover:bg-background"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={`inline-block rounded px-2 py-0.5 text-caption font-medium ${WORKOUT_TYPE_COLOR[workout.workout_type]}`}
            >
              {WORKOUT_TYPE_LABELS[workout.workout_type]}
            </span>
            <h1 className="mt-1 font-display text-display-lg text-ink">{workout.name}</h1>
          </div>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="text-body-sm text-accent hover:underline"
            >
              Rename
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                if (!confirm(`Delete "${workout.name}" and all its exercises?`)) return;
                setDeleting(true);
                const formData = new FormData();
                formData.set("client_id", clientId);
                formData.set("workout_id", workout.id);
                await deleteWorkout(formData);
                router.push(`/coach/clients/${clientId}?plan=${planId}`);
              }}
              className="text-body-sm text-warning hover:underline disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete workout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseEditRow({
  exercise,
  clientId,
  workoutId,
  workoutType,
}: {
  exercise: Exercise;
  clientId: string;
  workoutId: string;
  workoutType: WorkoutType;
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
        <input type="hidden" name="workout_id" value={workoutId} />
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
        <TypeAdaptiveExerciseFields workoutType={workoutType} defaultValues={exercise} />
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
          {summarizeTargets(workoutType, exercise)}
        </p>
        {exercise.notes && <p className="mt-1 text-caption text-charcoal">{exercise.notes}</p>}
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
          <input type="hidden" name="workout_id" value={workoutId} />
          <input type="hidden" name="exercise_id" value={exercise.id} />
          <button type="submit" className="text-caption text-warning hover:underline">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function AddExerciseForm({
  clientId,
  workoutId,
  workoutType,
}: {
  clientId: string;
  workoutId: string;
  workoutType: WorkoutType;
}) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="text-body-sm text-accent hover:underline"
      >
        + Add exercise
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createExercise(formData);
        setShowForm(false);
      }}
      className="space-y-3 rounded border border-dashed border-neutral p-3"
    >
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="workout_id" value={workoutId} />
      <div className="space-y-1">
        <label className="block text-caption text-charcoal">Exercise name</label>
        <input
          name="name"
          required
          className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
        />
      </div>
      <TypeAdaptiveExerciseFields workoutType={workoutType} />
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
          onClick={() => setShowForm(false)}
          className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function WorkoutInstanceEditor({
  clientId,
  planId,
  workout,
}: {
  clientId: string;
  planId: string;
  workout: Workout;
}) {
  return (
    <div className="space-y-4">
      <WorkoutHeader clientId={clientId} planId={planId} workout={workout} />

      <div className="space-y-2 rounded border border-neutral bg-white p-4">
        {workout.exercises.map((exercise) => (
          <ExerciseEditRow
            key={exercise.id}
            exercise={exercise}
            clientId={clientId}
            workoutId={workout.id}
            workoutType={workout.workout_type}
          />
        ))}
        <AddExerciseForm clientId={clientId} workoutId={workout.id} workoutType={workout.workout_type} />
      </div>
    </div>
  );
}

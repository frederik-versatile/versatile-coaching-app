"use client";

import { useState } from "react";
import WorkoutLogForm from "./WorkoutLogForm";
import { logWorkoutSkipped } from "./actions";
import type { Workout, WorkoutLog } from "./types";

export default function WorkoutView({
  workout,
  existingLog,
}: {
  workout: Workout;
  existingLog: WorkoutLog | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showCompletedForm, setShowCompletedForm] = useState(false);
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [skipNotes, setSkipNotes] = useState(existingLog?.notes || "");
  const [saving, setSaving] = useState(false);

  const statusLabel =
    existingLog?.status === "completed"
      ? "Completed"
      : existingLog?.status === "skipped"
      ? "Skipped"
      : null;

  async function handleConfirmSkip() {
    setSaving(true);
    await logWorkoutSkipped({ workoutId: workout.id, notes: skipNotes || null });
    setSaving(false);
    setShowSkipForm(false);
  }

  return (
    <div className="rounded border border-neutral bg-background p-3">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-body font-medium text-ink">{workout.name}</span>
        <span className="flex items-center gap-2 text-body-sm">
          {statusLabel && (
            <span
              className={
                existingLog?.status === "completed"
                  ? "text-success"
                  : "text-warning"
              }
            >
              {statusLabel}
            </span>
          )}
          <span className="text-accent">{expanded ? "Hide" : "Show"}</span>
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <ul className="space-y-2">
            {workout.exercises.map((exercise) => (
              <li
                key={exercise.id}
                className="rounded border border-neutral bg-white px-3 py-2"
              >
                <p className="text-body-sm font-medium text-ink">{exercise.name}</p>
                <p className="font-mono text-data tabular-nums text-charcoal">
                  {[
                    exercise.target_sets ? `${exercise.target_sets} sets` : null,
                    exercise.target_reps ? `${exercise.target_reps} reps` : null,
                    exercise.target_weight_kg
                      ? `${exercise.target_weight_kg} kg`
                      : null,
                  ]
                    .filter(Boolean)
                    .join("  ·  ") || "No targets set"}
                </p>
                {exercise.notes && (
                  <p className="mt-1 text-caption text-charcoal">{exercise.notes}</p>
                )}
              </li>
            ))}
          </ul>

          {showCompletedForm ? (
            <WorkoutLogForm
              workout={workout}
              existingLog={existingLog?.status === "completed" ? existingLog : null}
              onDone={() => setShowCompletedForm(false)}
            />
          ) : showSkipForm ? (
            <div className="space-y-2 rounded border border-dashed border-neutral p-3">
              <textarea
                value={skipNotes}
                onChange={(e) => setSkipNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleConfirmSkip}
                  className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Confirm skipped"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSkipForm(false)}
                  className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCompletedForm(true)}
                className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90"
              >
                {existingLog?.status === "completed" ? "Edit log" : "Mark completed"}
              </button>
              <button
                type="button"
                onClick={() => setShowSkipForm(true)}
                className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
              >
                {existingLog?.status === "skipped" ? "Edit" : "Mark skipped"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

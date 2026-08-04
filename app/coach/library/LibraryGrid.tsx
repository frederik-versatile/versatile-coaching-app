"use client";

import { useState } from "react";
import TypeAdaptiveExerciseFields from "@/components/TypeAdaptiveExerciseFields";
import {
  WORKOUT_TYPES,
  WORKOUT_TYPE_LABELS,
  WORKOUT_TYPE_COLOR,
  summarizeTargets,
  type WorkoutType,
} from "@/lib/workoutTypes";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createTemplateExercise,
  updateTemplateExercise,
  deleteTemplateExercise,
} from "./actions";

type TemplateExercise = {
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
};

type Template = {
  id: string;
  name: string;
  workout_type: WorkoutType;
  notes: string | null;
  template_exercises: TemplateExercise[];
};

function TemplateExerciseRow({
  exercise,
  templateId,
  workoutType,
}: {
  exercise: TemplateExercise;
  templateId: string;
  workoutType: WorkoutType;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form
        action={async (formData) => {
          await updateTemplateExercise(formData);
          setIsEditing(false);
        }}
        className="space-y-3 rounded border border-accent bg-background p-3"
      >
        <input type="hidden" name="template_exercise_id" value={exercise.id} />
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
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-caption text-accent hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={async () => {
            if (confirm(`Delete "${exercise.name}"?`)) {
              await deleteTemplateExercise(exercise.id);
            }
          }}
          className="text-caption text-warning hover:underline"
        >
          Delete
        </button>
      </div>
      <input type="hidden" name="workout_template_id" value={templateId} />
    </div>
  );
}

function AddTemplateExerciseForm({
  templateId,
  workoutType,
}: {
  templateId: string;
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
        await createTemplateExercise(formData);
        setShowForm(false);
      }}
      className="space-y-3 rounded border border-dashed border-neutral p-3"
    >
      <input type="hidden" name="workout_template_id" value={templateId} />
      <div className="space-y-1">
        <label className="block text-caption text-charcoal">Exercise name</label>
        <input
          name="name"
          required
          className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
        />
      </div>
      <TypeAdaptiveExerciseFields workoutType={workoutType} />
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

function TemplateCard({ template }: { template: Template }) {
  const [expanded, setExpanded] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [name, setName] = useState(template.name);
  const [workoutType, setWorkoutType] = useState<WorkoutType>(template.workout_type);
  const [notes, setNotes] = useState(template.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSaveHeader() {
    setSaving(true);
    await updateTemplate({ templateId: template.id, name, workoutType, notes: notes || null });
    setSaving(false);
    setEditingHeader(false);
  }

  return (
    <div className="space-y-3 rounded border border-neutral bg-white p-4">
      {editingHeader ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Workout name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Type</label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
              className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
            >
              {WORKOUT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WORKOUT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-caption text-charcoal">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveHeader}
              className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditingHeader(false)}
              className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-display-sm text-ink">{template.name}</h3>
            <span
              className={`mt-1 inline-block rounded px-2 py-0.5 text-caption font-medium ${WORKOUT_TYPE_COLOR[template.workout_type]}`}
            >
              {WORKOUT_TYPE_LABELS[template.workout_type]}
            </span>
            <p className="mt-1 text-caption text-charcoal">
              {template.template_exercises.length} exercise
              {template.template_exercises.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditingHeader(true)}
              className="text-caption text-accent hover:underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={async () => {
                if (confirm(`Delete "${template.name}"? This can't be undone.`)) {
                  await deleteTemplate(template.id);
                }
              }}
              className="text-caption text-warning hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="text-body-sm text-accent hover:underline"
      >
        {expanded ? "Hide exercises" : "Edit exercises"}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-neutral pt-3">
          {template.template_exercises.map((exercise) => (
            <TemplateExerciseRow
              key={exercise.id}
              exercise={exercise}
              templateId={template.id}
              workoutType={template.workout_type}
            />
          ))}
          <AddTemplateExerciseForm templateId={template.id} workoutType={template.workout_type} />
        </div>
      )}
    </div>
  );
}

function NewTemplateForm({ onDone }: { onDone: () => void }) {
  return (
    <form
      action={async (formData) => {
        await createTemplate(formData);
        onDone();
      }}
      className="space-y-3 rounded border border-accent bg-background p-4"
    >
      <div className="space-y-1">
        <label htmlFor="new-name" className="block text-body-sm text-charcoal">
          Workout name
        </label>
        <input
          id="new-name"
          name="name"
          required
          className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="new-type" className="block text-body-sm text-charcoal">
          Type
        </label>
        <select
          id="new-type"
          name="workout_type"
          defaultValue="strength"
          className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
        >
          {WORKOUT_TYPES.map((t) => (
            <option key={t} value={t}>
              {WORKOUT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="new-notes" className="block text-body-sm text-charcoal">
          Notes (optional)
        </label>
        <textarea
          id="new-notes"
          name="notes"
          rows={2}
          className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-accent px-4 py-2 text-body-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Create workout
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-neutral px-4 py-2 text-body-sm text-ink transition-colors hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function LibraryGrid({ templates }: { templates: Template[] }) {
  const [filter, setFilter] = useState<WorkoutType | "all">("all");
  const [showNewForm, setShowNewForm] = useState(false);

  const visible = filter === "all" ? templates : templates.filter((t) => t.workout_type === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1 text-body-sm transition-colors ${
              filter === "all" ? "bg-accent text-white" : "border border-neutral bg-white text-ink hover:bg-background"
            }`}
          >
            All
          </button>
          {WORKOUT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`rounded px-3 py-1 text-body-sm transition-colors ${
                filter === t ? "bg-accent text-white" : "border border-neutral bg-white text-ink hover:bg-background"
              }`}
            >
              {WORKOUT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm((s) => !s)}
          className="rounded bg-accent px-4 py-2 text-body-sm font-medium text-white transition-colors hover:opacity-90"
        >
          + New Workout
        </button>
      </div>

      {showNewForm && <NewTemplateForm onDone={() => setShowNewForm(false)} />}

      {visible.length === 0 ? (
        <p className="text-body text-charcoal">
          No workouts here yet — create one above to start building your library.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}

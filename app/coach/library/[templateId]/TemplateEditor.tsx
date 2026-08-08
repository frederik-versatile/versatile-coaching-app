"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TypeAdaptiveExerciseFields from "@/components/TypeAdaptiveExerciseFields";
import { WORKOUT_TYPES, WORKOUT_TYPE_LABELS, summarizeTargets, type WorkoutType } from "@/lib/workoutTypes";
import {
  updateTemplate,
  deleteTemplate,
  createSection,
  updateSection,
  deleteSection,
  createCatalogExercise,
  addCatalogExerciseToSection,
  createTemplateExercise,
  updateTemplateExercise,
  deleteTemplateExercise,
  groupIntoSuperset,
  removeFromSuperset,
} from "../actions";

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
  superset_group: string | null;
};

// Drag-one-exercise-onto-another's custom MIME type -- distinct from the
// catalog sidebar's plain "text/plain" drag, so dropping an exercise row
// onto another exercise row groups them into a superset, while dropping a
// catalog exercise into the section's own drop zone still just adds it.
const SUPERSET_DRAG_TYPE = "application/x-superset-source";

type DisplayItem =
  | { type: "single"; exercise: Exercise }
  | { type: "superset"; groupId: string; label: string; exercises: Exercise[] };

// Groups are built fresh from the data every render (letters/numbers are
// computed, never stored) so reordering or adding exercises can never leave
// a stale label behind. Assumes `exercises` is already in sort_order.
function buildDisplayItems(exercises: Exercise[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  const seenGroups = new Set<string>();
  let nextLetterCode = "A".charCodeAt(0);

  for (const exercise of exercises) {
    if (!exercise.superset_group) {
      items.push({ type: "single", exercise });
      continue;
    }
    if (seenGroups.has(exercise.superset_group)) continue;
    seenGroups.add(exercise.superset_group);
    items.push({
      type: "superset",
      groupId: exercise.superset_group,
      label: String.fromCharCode(nextLetterCode++),
      exercises: exercises.filter((e) => e.superset_group === exercise.superset_group),
    });
  }

  return items;
}

type Section = {
  id: string;
  name: string;
  template_exercises: Exercise[];
};

type Template = {
  id: string;
  name: string;
  workout_type: WorkoutType;
  notes: string | null;
  tag: string | null;
};

type CatalogExercise = { id: string; name: string };

function TemplateHeader({
  template,
  workoutType,
  onWorkoutTypeChange,
}: {
  template: Template;
  workoutType: WorkoutType;
  onWorkoutTypeChange: (t: WorkoutType) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [notes, setNotes] = useState(template.notes ?? "");
  const [tag, setTag] = useState(template.tag ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateTemplate({
      templateId: template.id,
      name,
      workoutType,
      notes: notes || null,
      tag: tag || null,
    });
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${template.name}"? This can't be undone.`)) return;
    setDeleting(true);
    await deleteTemplate(template.id);
    router.push("/coach/library");
  }

  return (
    <div className="space-y-3 rounded border border-neutral bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="block text-body-sm text-charcoal">Workout name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-body-sm text-charcoal">Type</label>
          <select
            value={workoutType}
            onChange={(e) => onWorkoutTypeChange(e.target.value as WorkoutType)}
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
          <label className="block text-body-sm text-charcoal">Tag (optional)</label>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. Push, Legs, Off-season"
            className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-body-sm text-charcoal">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded bg-accent px-4 py-2 text-body-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="rounded border border-neutral px-4 py-2 text-body-sm text-warning transition-colors hover:bg-background disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete workout"}
        </button>
      </div>
    </div>
  );
}

function AddCatalogExerciseForm({ templateId }: { templateId: string }) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="text-body-sm text-accent hover:underline"
      >
        + Add new exercise
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createCatalogExercise(formData);
        setShowForm(false);
      }}
      className="space-y-2 rounded border border-dashed border-neutral p-2"
    >
      <input type="hidden" name="template_id" value={templateId} />
      <label className="block text-caption text-charcoal" htmlFor="new-catalog-exercise">
        Exercise name
      </label>
      <input
        id="new-catalog-exercise"
        name="name"
        required
        className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-accent px-2 py-1 text-caption font-medium text-white transition-colors hover:opacity-90"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded border border-neutral px-2 py-1 text-caption text-ink transition-colors hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CatalogSidebar({ catalog, templateId }: { catalog: CatalogExercise[]; templateId: string }) {
  const [search, setSearch] = useState("");
  const visible = catalog.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-64 shrink-0 space-y-3 rounded border border-neutral bg-white p-3">
      <h2 className="font-display text-body font-medium text-ink">Exercise Library</h2>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises…"
        aria-label="Search exercises"
        className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
      />

      {catalog.length === 0 ? (
        <p className="text-caption text-charcoal">
          No exercises yet — add one below to start your library.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-caption text-charcoal">No matches.</p>
      ) : (
        <ul className="max-h-96 space-y-1.5 overflow-y-auto">
          {visible.map((exercise) => (
            <li
              key={exercise.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", exercise.id)}
              className="cursor-grab rounded border border-neutral bg-background px-2 py-1.5 text-body-sm text-ink active:cursor-grabbing"
            >
              {exercise.name}
            </li>
          ))}
        </ul>
      )}

      <AddCatalogExerciseForm templateId={templateId} />
    </div>
  );
}

function TemplateExerciseRow({
  exercise,
  templateId,
  sectionId,
  workoutType,
  supersetLabel,
}: {
  exercise: Exercise;
  templateId: string;
  sectionId: string;
  workoutType: WorkoutType;
  supersetLabel: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (isEditing) {
    return (
      <form
        action={async (formData) => {
          await updateTemplateExercise(formData);
          setIsEditing(false);
        }}
        className="space-y-3 rounded border border-accent bg-background p-3"
      >
        <input type="hidden" name="template_id" value={templateId} />
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
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData(SUPERSET_DRAG_TYPE, exercise.id)}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(SUPERSET_DRAG_TYPE)) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async (e) => {
        const draggedExerciseId = e.dataTransfer.getData(SUPERSET_DRAG_TYPE);
        if (!draggedExerciseId) return;
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        await groupIntoSuperset({
          templateId,
          sectionId,
          draggedExerciseId,
          targetExerciseId: exercise.id,
        });
      }}
      className={`flex cursor-grab items-start justify-between gap-2 rounded border bg-white px-3 py-2 active:cursor-grabbing ${
        dragOver ? "border-accent bg-accent/5" : "border-neutral"
      }`}
    >
      <div>
        {supersetLabel && (
          <span className="mb-1 inline-block rounded bg-accent/10 px-1.5 py-0.5 text-caption font-medium text-accent">
            {supersetLabel}
          </span>
        )}
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
        {supersetLabel && (
          <button
            type="button"
            onClick={() => removeFromSuperset({ templateId, sectionId, exerciseId: exercise.id })}
            className="text-caption text-charcoal hover:underline"
          >
            Ungroup
          </button>
        )}
        <button
          type="button"
          onClick={async () => {
            if (confirm(`Delete "${exercise.name}"?`)) {
              await deleteTemplateExercise({ exerciseId: exercise.id, templateId });
            }
          }}
          className="text-caption text-warning hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function AddTemplateExerciseForm({
  templateId,
  sectionId,
  workoutType,
}: {
  templateId: string;
  sectionId: string;
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
      <input type="hidden" name="section_id" value={sectionId} />
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

function SectionCard({
  section,
  templateId,
  workoutType,
}: {
  section: Section;
  templateId: string;
  workoutType: WorkoutType;
}) {
  const [renaming, setRenaming] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-3 rounded border border-neutral bg-white p-4">
      {renaming ? (
        <form
          action={async (formData) => {
            const name = formData.get("name") as string;
            await updateSection({ sectionId: section.id, templateId, name });
            setRenaming(false);
          }}
          className="flex gap-2"
        >
          <input
            name="name"
            defaultValue={section.name}
            required
            autoFocus
            className="flex-1 rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
          />
          <button
            type="submit"
            className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setRenaming(false)}
            className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-display-sm text-ink">{section.name}</h3>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="text-caption text-accent hover:underline"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={async () => {
                const suffix =
                  section.template_exercises.length > 0
                    ? ` and its ${section.template_exercises.length} exercise${section.template_exercises.length === 1 ? "" : "s"}`
                    : "";
                if (confirm(`Delete section "${section.name}"${suffix}?`)) {
                  await deleteSection({ sectionId: section.id, templateId });
                }
              }}
              className="text-caption text-warning hover:underline"
            >
              Delete section
            </button>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const catalogExerciseId = e.dataTransfer.getData("text/plain");
          if (!catalogExerciseId) return;
          await addCatalogExerciseToSection({ sectionId: section.id, templateId, catalogExerciseId });
        }}
        className={`space-y-2 rounded border border-dashed p-2 transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-neutral"
        }`}
      >
        {section.template_exercises.length === 0 && !dragOver && (
          <p className="py-2 text-center text-caption text-charcoal">
            Drag an exercise here, or add one below
          </p>
        )}
        {buildDisplayItems(section.template_exercises).map((item) =>
          item.type === "single" ? (
            <TemplateExerciseRow
              key={item.exercise.id}
              exercise={item.exercise}
              templateId={templateId}
              sectionId={section.id}
              workoutType={workoutType}
              supersetLabel={null}
            />
          ) : (
            <div key={item.groupId} className="space-y-1.5 rounded border-2 border-accent/30 p-1.5">
              <p className="text-caption font-medium text-accent">Superset {item.label}</p>
              {item.exercises.map((exercise, i) => (
                <TemplateExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  templateId={templateId}
                  sectionId={section.id}
                  workoutType={workoutType}
                  supersetLabel={`${item.label}${i + 1}`}
                />
              ))}
            </div>
          )
        )}
      </div>

      {section.template_exercises.length > 1 && (
        <p className="text-caption text-charcoal">
          Drag one exercise onto another to group them into a superset.
        </p>
      )}
      <AddTemplateExerciseForm templateId={templateId} sectionId={section.id} workoutType={workoutType} />
    </div>
  );
}

function AddSectionForm({ templateId }: { templateId: string }) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full rounded border border-dashed border-neutral py-2 text-body-sm text-charcoal transition-colors hover:border-accent hover:text-accent"
      >
        + Add section
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createSection(formData);
        setShowForm(false);
      }}
      className="space-y-2 rounded border border-accent bg-background p-3"
    >
      <input type="hidden" name="workout_template_id" value={templateId} />
      <label className="block text-caption text-charcoal" htmlFor="new-section-name">
        Section name
      </label>
      <input
        id="new-section-name"
        name="name"
        required
        placeholder="e.g. Warm-up"
        className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Add section
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

export default function TemplateEditor({
  template,
  sections,
  catalog,
}: {
  template: Template;
  sections: Section[];
  catalog: CatalogExercise[];
}) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>(template.workout_type);

  return (
    <div className="space-y-4">
      <TemplateHeader template={template} workoutType={workoutType} onWorkoutTypeChange={setWorkoutType} />

      <div className="flex gap-4 overflow-x-auto pb-2">
        <CatalogSidebar catalog={catalog} templateId={template.id} />

        <div className="min-w-[480px] flex-1 space-y-3">
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} templateId={template.id} workoutType={workoutType} />
          ))}
          <AddSectionForm templateId={template.id} />
        </div>
      </div>
    </div>
  );
}

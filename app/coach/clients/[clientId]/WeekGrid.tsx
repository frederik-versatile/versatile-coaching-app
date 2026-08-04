"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/lib/days";
import {
  WORKOUT_TYPES,
  WORKOUT_TYPE_LABELS,
  WORKOUT_TYPE_COLOR,
  summarizeTargets,
  type WorkoutType,
} from "@/lib/workoutTypes";
import TypeAdaptiveExerciseFields from "@/components/TypeAdaptiveExerciseFields";
import {
  scheduleTemplate,
  updateWorkout,
  deleteWorkout,
  createExercise,
  updateExercise,
  deleteExercise,
} from "./actions";

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
  day_of_week: number;
  time_slot: TimeSlot;
  workout_type: WorkoutType;
  name: string;
  exercises: Exercise[];
};

type Template = {
  id: string;
  name: string;
  workout_type: WorkoutType;
  template_exercises: { id: string }[];
};

type TimeSlot = "am" | "midday" | "pm";
const TIME_SLOTS: TimeSlot[] = ["am", "midday", "pm"];
const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  am: "AM",
  midday: "Midday",
  pm: "PM",
};

function ExerciseEditRow({
  exercise,
  clientId,
  workoutType,
}: {
  exercise: Exercise;
  clientId: string;
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

function ScheduledWorkoutCard({ workout, clientId }: { workout: Workout; clientId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);

  return (
    <div className="space-y-2 rounded border border-neutral bg-white p-2">
      {renaming ? (
        <form
          action={async (formData) => {
            await updateWorkout(formData);
            setRenaming(false);
          }}
          className="space-y-2"
        >
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="workout_id" value={workout.id} />
          <input type="hidden" name="day_of_week" value={workout.day_of_week} />
          <input type="hidden" name="time_slot" value={workout.time_slot} />
          <input
            name="name"
            defaultValue={workout.name}
            required
            autoFocus
            className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-2 py-0.5 text-caption font-medium text-white transition-colors hover:opacity-90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setRenaming(false)}
              className="rounded border border-neutral px-2 py-0.5 text-caption text-ink transition-colors hover:bg-background"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="block w-full text-left"
        >
          <span
            className={`inline-block rounded px-1.5 py-0.5 text-caption font-medium ${WORKOUT_TYPE_COLOR[workout.workout_type]}`}
          >
            {WORKOUT_TYPE_LABELS[workout.workout_type]}
          </span>
          <span className="mt-1 block text-body-sm font-medium text-ink">{workout.name}</span>
        </button>
      )}

      {expanded && !renaming && (
        <div className="space-y-2 border-t border-neutral pt-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="text-caption text-accent hover:underline"
            >
              Rename
            </button>
            <form
              action={deleteWorkout}
              onSubmit={(e) => {
                if (!confirm(`Delete "${workout.name}" and all its exercises?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="client_id" value={clientId} />
              <input type="hidden" name="workout_id" value={workout.id} />
              <button type="submit" className="text-caption text-warning hover:underline">
                Delete workout
              </button>
            </form>
          </div>

          {workout.exercises.map((exercise) => (
            <ExerciseEditRow
              key={exercise.id}
              exercise={exercise}
              clientId={clientId}
              workoutType={workout.workout_type}
            />
          ))}
          <AddExerciseForm clientId={clientId} workoutId={workout.id} workoutType={workout.workout_type} />
        </div>
      )}
    </div>
  );
}

function AddWorkoutPicker({
  templates,
  clientId,
  planId,
  dayOfWeek,
  timeSlot,
}: {
  templates: Template[];
  clientId: string;
  planId: string;
  dayOfWeek: number;
  timeSlot: TimeSlot;
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [scheduling, setScheduling] = useState(false);

  if (templates.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded border border-dashed border-neutral py-1 text-caption text-charcoal transition-colors hover:border-accent hover:text-accent"
      >
        + Add
      </button>
    );
  }

  return (
    <div className="space-y-1 rounded border border-accent bg-background p-1.5">
      <select
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        className="w-full rounded border border-neutral bg-white px-1 py-1 text-caption text-ink focus:border-accent"
      >
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={scheduling}
          onClick={async () => {
            setScheduling(true);
            await scheduleTemplate({ clientId, planId, templateId, dayOfWeek, timeSlot });
            setScheduling(false);
            setOpen(false);
          }}
          className="flex-1 rounded bg-accent py-0.5 text-caption font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {scheduling ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-neutral px-2 py-0.5 text-caption text-ink transition-colors hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function GridCell({
  workouts,
  templates,
  clientId,
  planId,
  dayOfWeek,
  timeSlot,
}: {
  workouts: Workout[];
  templates: Template[];
  clientId: string;
  planId: string;
  dayOfWeek: number;
  timeSlot: TimeSlot;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragOver(false);
        const templateId = e.dataTransfer.getData("text/plain");
        if (!templateId) return;
        await scheduleTemplate({ clientId, planId, templateId, dayOfWeek, timeSlot });
      }}
      className={`min-h-[5rem] space-y-1.5 rounded border p-1.5 transition-colors ${
        dragOver ? "border-accent bg-accent/5" : "border-neutral bg-background"
      }`}
    >
      {workouts.length === 0 && !dragOver && (
        <p className="py-2 text-center text-caption text-charcoal">Drop workout here</p>
      )}
      {workouts.map((workout) => (
        <ScheduledWorkoutCard key={workout.id} workout={workout} clientId={clientId} />
      ))}
      <AddWorkoutPicker
        templates={templates}
        clientId={clientId}
        planId={planId}
        dayOfWeek={dayOfWeek}
        timeSlot={timeSlot}
      />
    </div>
  );
}

function TemplateSidebar({ templates }: { templates: Template[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WorkoutType | "all">("all");

  const visible = templates.filter((t) => {
    if (filter !== "all" && t.workout_type !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-56 shrink-0 space-y-3 rounded border border-neutral bg-white p-3">
      <h2 className="font-display text-body font-medium text-ink">Workouts</h2>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        aria-label="Search workouts"
        className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
      />
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded px-2 py-0.5 text-caption transition-colors ${
            filter === "all" ? "bg-accent text-white" : "border border-neutral text-ink hover:bg-background"
          }`}
        >
          All
        </button>
        {WORKOUT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded px-2 py-0.5 text-caption transition-colors ${
              filter === t ? "bg-accent text-white" : "border border-neutral text-ink hover:bg-background"
            }`}
          >
            {WORKOUT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {templates.length === 0 ? (
        <p className="text-caption text-charcoal">
          No workouts in your library yet. Add some from the Library tab.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-caption text-charcoal">No matches.</p>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((t) => (
            <li
              key={t.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
              className="cursor-grab space-y-1 rounded border border-neutral bg-background p-2 active:cursor-grabbing"
            >
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-caption font-medium ${WORKOUT_TYPE_COLOR[t.workout_type]}`}
              >
                {WORKOUT_TYPE_LABELS[t.workout_type]}
              </span>
              <p className="text-body-sm text-ink">{t.name}</p>
              <p className="text-caption text-charcoal">
                {t.template_exercises.length} exercise{t.template_exercises.length === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 7x3 calendar grid (days x AM/Midday/PM slots) replacing the old day-selector
// editor. The template sidebar is coach-only by construction: this component
// is never rendered on the client dashboard (see WeekGridReadOnly for that).
export default function WeekGrid({
  workouts,
  templates,
  clientId,
  planId,
}: {
  workouts: Workout[];
  templates: Template[];
  clientId: string;
  planId: string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      <TemplateSidebar templates={templates} />

      <div className="grid min-w-[840px] flex-1 grid-cols-7 gap-2">
        {DAY_LABELS.map((label, dayOfWeek) => (
          <div key={label} className="space-y-2">
            <h3 className="text-center text-body-sm font-medium text-ink">{label}</h3>
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="space-y-1">
                <p className="text-center text-caption text-charcoal">{TIME_SLOT_LABELS[slot]}</p>
                <GridCell
                  workouts={workouts.filter((w) => w.day_of_week === dayOfWeek && w.time_slot === slot)}
                  templates={templates}
                  clientId={clientId}
                  planId={planId}
                  dayOfWeek={dayOfWeek}
                  timeSlot={slot}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { DAY_LABELS } from "@/lib/days";
import { WORKOUT_TYPES, WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLOR, type WorkoutType } from "@/lib/workoutTypes";
import { scheduleTemplate } from "./actions";
import { createBlankTemplate } from "@/app/coach/library/actions";

type Workout = {
  id: string;
  day_of_week: number;
  time_slot: TimeSlot;
  workout_type: WorkoutType;
  name: string;
  exercises: { id: string }[];
};

type Template = {
  id: string;
  name: string;
  workout_type: WorkoutType;
  tag: string | null;
  template_exercises: { id: string }[];
};

type TimeSlot = "am" | "midday" | "pm";
const TIME_SLOTS: TimeSlot[] = ["am", "midday", "pm"];
const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  am: "AM",
  midday: "Midday",
  pm: "PM",
};

// Full exercise editing lives on its own page now
// (/coach/clients/[clientId]/workouts/[workoutId]) -- a scheduled workout's
// card is just a link into that page, since a 1/7-width grid cell has no
// room to expand a real exercise editor without wrapping into neighboring
// day columns.
function ScheduledWorkoutCard({ workout, clientId }: { workout: Workout; clientId: string }) {
  return (
    <Link
      href={`/coach/clients/${clientId}/workouts/${workout.id}`}
      className="block space-y-1 rounded border border-neutral bg-white p-2 transition-colors hover:border-accent"
    >
      <span
        className={`inline-block rounded px-1.5 py-0.5 text-caption font-medium ${WORKOUT_TYPE_COLOR[workout.workout_type]}`}
      >
        {WORKOUT_TYPE_LABELS[workout.workout_type]}
      </span>
      <span className="block text-body-sm font-medium text-ink">{workout.name}</span>
      <span className="block text-caption text-charcoal">
        {workout.exercises.length} exercise{workout.exercises.length === 1 ? "" : "s"}
      </span>
    </Link>
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
  const [tagFilter, setTagFilter] = useState<string | "all">("all");

  // Tags are coach-defined free text, not a fixed set -- the filter chips
  // are built from whatever values are actually in use, not a hardcoded list.
  const distinctTags = Array.from(
    new Set(templates.map((t) => t.tag).filter((tag): tag is string => Boolean(tag)))
  ).sort();

  const visible = templates.filter((t) => {
    if (filter !== "all" && t.workout_type !== filter) return false;
    if (tagFilter !== "all" && t.tag !== tagFilter) return false;
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

      {distinctTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setTagFilter("all")}
            className={`rounded px-2 py-0.5 text-caption transition-colors ${
              tagFilter === "all" ? "bg-charcoal text-white" : "border border-neutral text-charcoal hover:bg-background"
            }`}
          >
            All tags
          </button>
          {distinctTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tag)}
              className={`rounded px-2 py-0.5 text-caption transition-colors ${
                tagFilter === tag ? "bg-charcoal text-white" : "border border-neutral text-charcoal hover:bg-background"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-caption text-charcoal">No workouts in your library yet.</p>
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
              {t.tag && <p className="text-caption text-charcoal">{t.tag}</p>}
              <p className="text-body-sm text-ink">{t.name}</p>
              <p className="text-caption text-charcoal">
                {t.template_exercises.length} exercise{t.template_exercises.length === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form action={createBlankTemplate}>
        <button
          type="submit"
          className="w-full rounded bg-accent px-3 py-1.5 text-body-sm font-medium text-white transition-colors hover:opacity-90"
        >
          + New Workout
        </button>
      </form>
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

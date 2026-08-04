"use client";

import { useState } from "react";
import Link from "next/link";
import {
  WORKOUT_TYPES,
  WORKOUT_TYPE_LABELS,
  WORKOUT_TYPE_COLOR,
  type WorkoutType,
} from "@/lib/workoutTypes";
import { createBlankTemplate, deleteTemplate } from "./actions";

type Template = {
  id: string;
  name: string;
  workout_type: WorkoutType;
  exerciseCount: number;
};

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="space-y-2 rounded border border-neutral bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-display-sm text-ink">{template.name}</h3>
          <span
            className={`mt-1 inline-block rounded px-2 py-0.5 text-caption font-medium ${WORKOUT_TYPE_COLOR[template.workout_type]}`}
          >
            {WORKOUT_TYPE_LABELS[template.workout_type]}
          </span>
          <p className="mt-1 text-caption text-charcoal">
            {template.exerciseCount} exercise{template.exerciseCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (confirm(`Delete "${template.name}"? This can't be undone.`)) {
              await deleteTemplate(template.id);
            }
          }}
          className="shrink-0 text-caption text-warning hover:underline"
        >
          Delete
        </button>
      </div>

      <Link
        href={`/coach/library/${template.id}`}
        className="text-body-sm text-accent hover:underline"
      >
        Edit workout →
      </Link>
    </div>
  );
}

export default function LibraryGrid({ templates }: { templates: Template[] }) {
  const [filter, setFilter] = useState<WorkoutType | "all">("all");

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
        <form action={createBlankTemplate}>
          <button
            type="submit"
            className="rounded bg-accent px-4 py-2 text-body-sm font-medium text-white transition-colors hover:opacity-90"
          >
            + New Workout
          </button>
        </form>
      </div>

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

"use client";

import { useState } from "react";
import { updateWeeklyPlan, deleteWeeklyPlan } from "../../actions";

export default function PlanHeader({
  clientId,
  planId,
  weekStart,
  notes,
  workoutLogCount,
}: {
  clientId: string;
  planId: string;
  weekStart: string;
  notes: string | null;
  workoutLogCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [weekStartValue, setWeekStartValue] = useState(weekStart);
  const [notesValue, setNotesValue] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateWeeklyPlan({
      planId,
      clientId,
      weekStart: weekStartValue,
      notes: notesValue || null,
    });
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    const message =
      workoutLogCount > 0
        ? `This plan has ${workoutLogCount} logged workout${
            workoutLogCount === 1 ? "" : "s"
          } against it. Deleting the plan permanently deletes that logged history too, not just the template. This can't be undone. Delete anyway?`
        : "Delete this weekly plan? This can't be undone.";

    if (!confirm(message)) return;

    setDeleting(true);
    await deleteWeeklyPlan({ planId, clientId });
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-accent bg-white p-4">
        <div className="space-y-1">
          <label className="block text-sm text-charcoal">Week start</label>
          <input
            type="date"
            value={weekStartValue}
            onChange={(e) => setWeekStartValue(e.target.value)}
            className="rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-charcoal">Notes</label>
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-neutral px-4 py-2 text-ink hover:bg-background"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Week of {weekStart}</h1>
        {notes && <p className="text-charcoal">{notes}</p>}
      </div>
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-accent hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="text-sm text-red-700 hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete plan"}
        </button>
      </div>
    </div>
  );
}

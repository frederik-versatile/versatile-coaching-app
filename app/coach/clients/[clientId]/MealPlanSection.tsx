"use client";

import { useState } from "react";
import { createMealPlan, updateMealPlan, deleteMealPlan } from "./nutritionActions";
import { pickCurrent, type MealPlan, type MealBlock } from "@/lib/nutrition";
import MealBlocksView from "@/app/client/dashboard/MealBlocksView";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function MealPlanForm({
  clientId,
  existing,
  onDone,
}: {
  clientId: string;
  existing?: MealPlan;
  onDone: () => void;
}) {
  const [effectiveDate, setEffectiveDate] = useState(
    existing?.effective_date ?? today()
  );
  const [blocks, setBlocks] = useState<MealBlock[]>(
    existing?.content?.length ? existing.content : [{ label: "", description: "" }]
  );
  const [saving, setSaving] = useState(false);

  function updateBlock(i: number, field: keyof MealBlock, value: string) {
    setBlocks((prev) =>
      prev.map((b, idx) => (idx === i ? { ...b, [field]: value } : b))
    );
  }
  function addBlock() {
    setBlocks((prev) => [...prev, { label: "", description: "" }]);
  }
  function removeBlock(i: number) {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = i + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const content = blocks.filter(
      (b) => b.label.trim() || b.description.trim()
    );
    const payload = { clientId, effectiveDate, content };
    if (existing) {
      await updateMealPlan({ id: existing.id, ...payload });
    } else {
      await createMealPlan(payload);
    }
    setSaving(false);
    onDone();
  }

  return (
    <div className="space-y-3 rounded border border-accent bg-background p-3">
      <div className="space-y-1">
        <label className="block text-caption text-charcoal">Effective date</label>
        <input
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          className="rounded border border-neutral px-2 py-1 font-mono text-data tabular-nums text-ink focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        {blocks.map((block, i) => (
          <div
            key={i}
            className="space-y-2 rounded border border-neutral bg-white p-2"
          >
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="block text-caption text-charcoal">
                  Meal label (e.g. Breakfast)
                </label>
                <input
                  value={block.label}
                  onChange={(e) => updateBlock(i, "label", e.target.value)}
                  className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
                />
              </div>
              <button
                type="button"
                onClick={() => moveBlock(i, -1)}
                disabled={i === 0}
                className="text-caption text-charcoal disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveBlock(i, 1)}
                disabled={i === blocks.length - 1}
                className="text-caption text-charcoal disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeBlock(i)}
                className="text-caption text-warning hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="space-y-1">
              <label className="block text-caption text-charcoal">Description</label>
              <textarea
                value={block.description}
                onChange={(e) => updateBlock(i, "description", e.target.value)}
                rows={2}
                className="w-full rounded border border-neutral px-2 py-1 text-body-sm text-ink focus:border-accent"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addBlock}
        className="text-body-sm text-accent hover:underline"
      >
        + Add meal block
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded bg-accent px-3 py-1 text-body-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-neutral px-3 py-1 text-body-sm text-ink transition-colors hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function MealPlanSection({
  clientId,
  mealPlans,
}: {
  clientId: string;
  mealPlans: MealPlan[];
}) {
  const current = pickCurrent(mealPlans);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded border border-neutral bg-white p-4">
      <h3 className="font-display text-display-sm text-ink">Meal plan</h3>

      {current ? (
        <div className="rounded bg-background px-3 py-2">
          <p className="text-body-sm font-medium text-ink">
            Current (since {current.effective_date})
          </p>
          <MealBlocksView blocks={current.content} />
        </div>
      ) : (
        <p className="text-body text-charcoal">
          No meal plan yet — set one below.
        </p>
      )}

      {showForm ? (
        <MealPlanForm clientId={clientId} onDone={() => setShowForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-body-sm text-accent hover:underline"
        >
          + Set new meal plan
        </button>
      )}

      {mealPlans.length > 0 && (
        <div className="space-y-2">
          <p className="text-body-sm font-medium text-charcoal">History</p>
          <ul className="space-y-2">
            {mealPlans.map((row) =>
              editingId === row.id ? (
                <li key={row.id}>
                  <MealPlanForm
                    clientId={clientId}
                    existing={row}
                    onDone={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={row.id}
                  className="rounded border border-neutral p-3 text-body-sm"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="font-mono tabular-nums">
                        {row.effective_date}
                      </span>
                      {current?.id === row.id && (
                        <span className="ml-2 text-accent">(current)</span>
                      )}
                      {" — "}
                      {row.content.length} meal
                      {row.content.length === 1 ? "" : "s"}
                    </span>
                    <span className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className="text-accent hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm("Delete this meal plan entry?")) {
                            await deleteMealPlan({ id: row.id, clientId });
                          }
                        }}
                        className="text-warning hover:underline"
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

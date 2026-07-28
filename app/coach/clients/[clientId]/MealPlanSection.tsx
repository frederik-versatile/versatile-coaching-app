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
    <div className="space-y-3 rounded-md border border-accent bg-background p-3">
      <div className="space-y-1">
        <label className="block text-xs text-charcoal">Effective date</label>
        <input
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        {blocks.map((block, i) => (
          <div
            key={i}
            className="space-y-1 rounded-md border border-neutral bg-white p-2"
          >
            <div className="flex items-center gap-2">
              <input
                value={block.label}
                onChange={(e) => updateBlock(i, "label", e.target.value)}
                placeholder="Label (e.g. Breakfast)"
                className="flex-1 rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => moveBlock(i, -1)}
                disabled={i === 0}
                className="text-xs text-charcoal disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveBlock(i, 1)}
                disabled={i === blocks.length - 1}
                className="text-xs text-charcoal disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeBlock(i)}
                className="text-xs text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>
            <textarea
              value={block.description}
              onChange={(e) => updateBlock(i, "description", e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addBlock}
        className="text-sm text-accent hover:underline"
      >
        + Add meal block
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-neutral px-3 py-1 text-sm text-ink hover:bg-white"
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
    <div className="space-y-3 rounded-lg border border-neutral bg-white p-4">
      <h3 className="font-medium text-ink">Meal plan</h3>

      {current ? (
        <div className="rounded-md bg-background px-3 py-2">
          <p className="text-sm font-medium text-ink">
            Current (since {current.effective_date})
          </p>
          <MealBlocksView blocks={current.content} />
        </div>
      ) : (
        <p className="text-charcoal">No meal plan set yet.</p>
      )}

      {showForm ? (
        <MealPlanForm clientId={clientId} onDone={() => setShowForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-sm text-accent hover:underline"
        >
          + Set new meal plan
        </button>
      )}

      {mealPlans.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-charcoal">History</p>
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
                  className="rounded-md border border-neutral p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {row.effective_date}
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
                        className="text-red-700 hover:underline"
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

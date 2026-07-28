"use client";

import { useState } from "react";
import { createMacroSplit, updateMacroSplit, deleteMacroSplit } from "./nutritionActions";
import { pickCurrent, type MacroSplit } from "@/lib/nutrition";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function macroSummary(row: MacroSplit) {
  return `${row.calories ?? "—"} kcal · ${row.protein_g ?? "—"}g protein · ${
    row.carbs_g ?? "—"
  }g carbs · ${row.fat_g ?? "—"}g fat`;
}

function MacroSplitForm({
  clientId,
  existing,
  onDone,
}: {
  clientId: string;
  existing?: MacroSplit;
  onDone: () => void;
}) {
  const [effectiveDate, setEffectiveDate] = useState(
    existing?.effective_date ?? today()
  );
  const [calories, setCalories] = useState(existing?.calories?.toString() ?? "");
  const [proteinG, setProteinG] = useState(existing?.protein_g?.toString() ?? "");
  const [carbsG, setCarbsG] = useState(existing?.carbs_g?.toString() ?? "");
  const [fatG, setFatG] = useState(existing?.fat_g?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const payload = {
      clientId,
      effectiveDate,
      calories: calories === "" ? null : Number(calories),
      proteinG: proteinG === "" ? null : Number(proteinG),
      carbsG: carbsG === "" ? null : Number(carbsG),
      fatG: fatG === "" ? null : Number(fatG),
    };
    if (existing) {
      await updateMacroSplit({ id: existing.id, ...payload });
    } else {
      await createMacroSplit(payload);
    }
    setSaving(false);
    onDone();
  }

  return (
    <div className="space-y-2 rounded-md border border-accent bg-background p-3">
      <div className="space-y-1">
        <label className="block text-xs text-charcoal">Effective date</label>
        <input
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          type="number"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
        />
        <input
          type="number"
          placeholder="Protein (g)"
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
          className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
        />
        <input
          type="number"
          placeholder="Carbs (g)"
          value={carbsG}
          onChange={(e) => setCarbsG(e.target.value)}
          className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
        />
        <input
          type="number"
          placeholder="Fat (g)"
          value={fatG}
          onChange={(e) => setFatG(e.target.value)}
          className="rounded-md border border-neutral px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
        />
      </div>
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

export default function MacroSplitSection({
  clientId,
  macroSplits,
}: {
  clientId: string;
  macroSplits: MacroSplit[];
}) {
  const current = pickCurrent(macroSplits);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded-lg border border-neutral bg-white p-4">
      <h3 className="font-medium text-ink">Macro split</h3>

      {current ? (
        <div className="rounded-md bg-background px-3 py-2 text-sm">
          <p className="font-medium text-ink">
            Current (since {current.effective_date})
          </p>
          <p className="text-charcoal">{macroSummary(current)}</p>
        </div>
      ) : (
        <p className="text-charcoal">No macro split set yet.</p>
      )}

      {showForm ? (
        <MacroSplitForm clientId={clientId} onDone={() => setShowForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-sm text-accent hover:underline"
        >
          + Set new macro split
        </button>
      )}

      {macroSplits.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-charcoal">History</p>
          <ul className="space-y-2">
            {macroSplits.map((row) =>
              editingId === row.id ? (
                <li key={row.id}>
                  <MacroSplitForm
                    clientId={clientId}
                    existing={row}
                    onDone={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-md border border-neutral px-3 py-2 text-sm"
                >
                  <span>
                    {row.effective_date}
                    {current?.id === row.id && (
                      <span className="ml-2 text-accent">(current)</span>
                    )}
                    {" — "}
                    {macroSummary(row)}
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
                        if (confirm("Delete this macro split entry?")) {
                          await deleteMacroSplit({ id: row.id, clientId });
                        }
                      }}
                      className="text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { logWeight } from "./actions";

type Entry = { id: string; log_date: string; weight_kg: number };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function WeightLog({ entries }: { entries: Entry[] }) {
  const [logDate, setLogDate] = useState(today());
  const [weightKg, setWeightKg] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weightKg) return;
    setSaving(true);
    await logWeight({ logDate, weightKg: Number(weightKg) });
    setSaving(false);
    setWeightKg("");
  }

  return (
    <section className="space-y-3 rounded-lg border border-neutral bg-white p-4">
      <h2 className="text-lg font-medium text-ink">Weight log</h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="weight_date" className="block text-sm text-charcoal">
            Date
          </label>
          <input
            id="weight_date"
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="weight_kg" className="block text-sm text-charcoal">
            Weight (kg)
          </label>
          <input
            id="weight_kg"
            type="number"
            step="0.1"
            required
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-32 rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Log weight"}
        </button>
      </form>

      {entries.length > 0 && (
        <ul className="divide-y divide-neutral">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-ink">{entry.log_date}</span>
              <div className="flex items-center gap-3">
                <span className="text-charcoal">{entry.weight_kg} kg</span>
                <button
                  type="button"
                  onClick={() => {
                    setLogDate(entry.log_date);
                    setWeightKg(entry.weight_kg.toString());
                  }}
                  className="text-xs text-accent hover:underline"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

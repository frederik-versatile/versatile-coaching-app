"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getProgressData, type ProgressPoint } from "./progressActions";

const RANGES = [30, 90, 180, 365] as const;

// Hex values matching tailwind.config.ts — Recharts takes literal color
// values (SVG attributes), not Tailwind classes, so the tokens are
// duplicated here rather than resolved from CSS.
const ACCENT = "#EC5E2A";
const CHARCOAL = "#5D5D5D";
const NEUTRAL = "#C4C4C4";

function ChartBlock({
  title,
  unit,
  data,
}: {
  title: string;
  unit: string;
  data: ProgressPoint[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-charcoal">{title}</h3>
      {data.length === 0 ? (
        <p className="flex h-48 items-center justify-center rounded-md border border-dashed border-neutral text-sm text-charcoal">
          No data for this period yet.
        </p>
      ) : (
        <div className="h-48 rounded-md border border-neutral bg-white p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={NEUTRAL} strokeDasharray="3 3" />
              <XAxis dataKey="logDate" tick={{ fontSize: 11, fill: CHARCOAL }} />
              <YAxis
                tick={{ fontSize: 11, fill: CHARCOAL }}
                width={48}
                unit={unit}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={ACCENT}
                strokeWidth={2}
                dot={{ r: 3, fill: ACCENT }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function ProgressCharts({ clientId }: { clientId: string }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(90);
  const [weight, setWeight] = useState<ProgressPoint[]>([]);
  const [volume, setVolume] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProgressData(clientId, days).then((data) => {
      if (cancelled) return;
      setWeight(data.weight);
      setVolume(data.volume);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, days]);

  return (
    <div className="space-y-4 rounded-lg border border-neutral bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-ink">Progress</h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className={`rounded-md px-3 py-1 text-sm ${
                days === r
                  ? "bg-accent text-white"
                  : "border border-neutral bg-white text-ink hover:bg-background"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-charcoal">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ChartBlock title="Weight (kg)" unit="kg" data={weight} />
          <ChartBlock title="Volume (kg)" unit="kg" data={volume} />
        </div>
      )}
    </div>
  );
}

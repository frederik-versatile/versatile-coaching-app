"use client";

import { DAY_LABELS } from "@/lib/days";
import type { DayState } from "@/lib/weekState";

export type { DayState } from "@/lib/weekState";
export { computeDayStates } from "@/lib/weekState";

const DAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

const STATE_LABEL: Record<DayState, string> = {
  completed: "completed",
  skipped: "skipped",
  rest: "rest day",
  upcoming: "not yet reached",
};

const STATE_CLASS: Record<DayState, string> = {
  completed: "bg-success",
  skipped: "bg-warning",
  rest: "bg-neutral/40",
  upcoming: "border border-neutral bg-transparent",
};

// The one shared structural device tying every screen together: a compact
// Mon-Sun strip showing each day's real state via fill, not icons. Used
// wherever a training week is displayed or built (client dashboard, coach
// plan editor) so the same visual vocabulary means the same thing everywhere.
//
// Read-only by default. Pass onSelectDay to make it double as the coach's
// day selector in the plan editor -- same component, same visual meaning,
// just interactive instead of a glance.
export default function WeekStrip({
  states,
  className,
  selectedIndex,
  onSelectDay,
}: {
  states: DayState[];
  className?: string;
  selectedIndex?: number;
  onSelectDay?: (dayIndex: number) => void;
}) {
  return (
    <div className={`flex gap-1.5 ${className ?? ""}`}>
      {states.map((state, i) => {
        const isSelected = selectedIndex === i;
        const segment = (
          <div
            role={onSelectDay ? undefined : "img"}
            aria-label={
              onSelectDay ? undefined : `${DAY_LABELS[i]}: ${STATE_LABEL[state]}`
            }
            className={`h-2 w-full rounded-full ${STATE_CLASS[state]}`}
          />
        );

        if (!onSelectDay) {
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-caption text-charcoal">{DAY_INITIALS[i]}</span>
              {segment}
            </div>
          );
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelectDay(i)}
            aria-pressed={isSelected}
            aria-label={`${DAY_LABELS[i]}: ${STATE_LABEL[state]}`}
            className={`flex flex-1 flex-col items-center gap-1 rounded py-1 transition-colors ${
              isSelected ? "bg-white" : "hover:bg-white/60"
            }`}
          >
            <span
              className={`text-caption ${
                isSelected ? "font-medium text-ink" : "text-charcoal"
              }`}
            >
              {DAY_INITIALS[i]}
            </span>
            {segment}
            <span
              className={`h-0.5 w-full rounded-full ${
                isSelected ? "bg-accent" : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

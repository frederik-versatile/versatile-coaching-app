"use client";

import { useState } from "react";
import Link from "next/link";
import { DAY_LABELS } from "@/lib/days";
import WeekStrip from "@/components/WeekStrip";
import { computeDayStates } from "@/lib/weekState";
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLOR } from "@/lib/workoutTypes";
import type { Plan, WorkoutLog } from "./types";

type TimeSlot = "am" | "midday" | "pm";
const TIME_SLOTS: TimeSlot[] = ["am", "midday", "pm"];
const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  am: "AM",
  midday: "Midday",
  pm: "PM",
};

// Read-only mirror of the coach's WeekGrid: same 7x3 day/slot layout, no
// sidebar, no drag. Clicking a scheduled workout links to its own page
// (same fix as the coach side -- a 1/7-width grid cell has no room to
// expand exercises + a log form without wrapping into neighboring days).
export default function WeekGridReadOnly({
  plan,
  logsByWorkoutId,
  defaultExpanded,
}: {
  plan: Plan;
  logsByWorkoutId: Record<string, WorkoutLog>;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const dayStates = computeDayStates(plan.workouts, logsByWorkoutId);

  return (
    <div className="rounded border border-neutral bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full flex-col gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-display-sm text-ink">
            Week of {plan.week_start}
          </span>
          <span className="text-body-sm text-accent">{expanded ? "Hide" : "Show"}</span>
        </div>
        <WeekStrip states={dayStates} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-neutral px-4 py-4">
          {plan.notes && <p className="text-body-sm text-charcoal">{plan.notes}</p>}

          {plan.workouts.length === 0 ? (
            <p className="text-body text-charcoal">
              No workouts in this plan yet — check back once your coach adds some.
            </p>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[840px] grid-cols-7 gap-2">
                {DAY_LABELS.map((label, dayOfWeek) => (
                  <div key={label} className="space-y-2">
                    <h3 className="text-center text-body-sm font-medium text-ink">{label}</h3>
                    {TIME_SLOTS.map((slot) => {
                      const slotWorkouts = plan.workouts.filter(
                        (w) => w.day_of_week === dayOfWeek && w.time_slot === slot
                      );
                      return (
                        <div key={slot} className="space-y-1">
                          <p className="text-center text-caption text-charcoal">
                            {TIME_SLOT_LABELS[slot]}
                          </p>
                          <div className="min-h-[3rem] space-y-1.5 rounded border border-neutral bg-background p-1.5">
                            {slotWorkouts.length === 0 ? (
                              <p className="py-2 text-center text-caption text-charcoal">Rest</p>
                            ) : (
                              slotWorkouts.map((workout) => {
                                const log = logsByWorkoutId[workout.id];
                                const statusLabel =
                                  log?.status === "completed"
                                    ? "Completed"
                                    : log?.status === "skipped"
                                    ? "Skipped"
                                    : null;
                                return (
                                  <Link
                                    key={workout.id}
                                    href={`/client/dashboard/workouts/${workout.id}`}
                                    className="block space-y-1 rounded border border-neutral bg-white p-2 transition-colors hover:border-accent"
                                  >
                                    <span
                                      className={`inline-block rounded px-1.5 py-0.5 text-caption font-medium ${WORKOUT_TYPE_COLOR[workout.workout_type]}`}
                                    >
                                      {WORKOUT_TYPE_LABELS[workout.workout_type]}
                                    </span>
                                    <span className="block text-body-sm font-medium text-ink">
                                      {workout.name}
                                    </span>
                                    {statusLabel && (
                                      <span
                                        className={`block text-caption ${
                                          log?.status === "completed" ? "text-success" : "text-warning"
                                        }`}
                                      >
                                        {statusLabel}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

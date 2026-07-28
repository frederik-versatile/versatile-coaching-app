"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/lib/days";
import WorkoutView from "./WorkoutView";
import type { Plan, WorkoutLog } from "./types";

export default function PlanAccordion({
  plan,
  logsByWorkoutId,
  defaultExpanded,
}: {
  plan: Plan;
  logsByWorkoutId: Record<string, WorkoutLog>;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const workoutsByDay = DAY_LABELS.map((label, dayOfWeek) => ({
    label,
    dayOfWeek,
    workouts: plan.workouts.filter((w) => w.day_of_week === dayOfWeek),
  })).filter((day) => day.workouts.length > 0);

  return (
    <div className="rounded-lg border border-neutral bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium text-ink">Week of {plan.week_start}</span>
        <span className="text-sm text-accent">{expanded ? "Hide" : "Show"}</span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-neutral px-4 py-4">
          {plan.notes && <p className="text-sm text-charcoal">{plan.notes}</p>}

          {workoutsByDay.length === 0 ? (
            <p className="text-charcoal">No workouts in this plan yet.</p>
          ) : (
            workoutsByDay.map((day) => (
              <div key={day.label} className="space-y-2">
                <h3 className="text-sm font-medium text-charcoal">{day.label}</h3>
                <div className="space-y-2">
                  {day.workouts.map((workout) => (
                    <WorkoutView
                      key={workout.id}
                      workout={workout}
                      existingLog={logsByWorkoutId[workout.id] || null}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

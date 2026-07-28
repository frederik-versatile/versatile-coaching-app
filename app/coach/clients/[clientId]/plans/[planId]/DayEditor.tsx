"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/lib/days";
import WeekStrip, { type DayState } from "@/components/WeekStrip";
import WorkoutCard from "./WorkoutCard";
import AddWorkoutForm from "./AddWorkoutForm";

type Exercise = {
  id: string;
  name: string;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  target_rest_seconds: number | null;
  notes: string | null;
};

type Workout = {
  id: string;
  day_of_week: number;
  name: string;
  exercises: Exercise[];
};

// Replaces the old 7-column grid, which overflowed before mobile was even a
// factor. The Week Strip is the day selector -- click a day, see just that
// day's workouts full-width below, the same "one thing at a time" pattern
// used on the client's own dashboard.
export default function DayEditor({
  workouts,
  dayStates,
  clientId,
  planId,
}: {
  workouts: Workout[];
  dayStates: DayState[];
  clientId: string;
  planId: string;
}) {
  const [selectedDay, setSelectedDay] = useState(0);

  const dayWorkouts = workouts.filter((w) => w.day_of_week === selectedDay);

  return (
    <div className="space-y-4">
      <div className="rounded border border-neutral bg-background p-3">
        <WeekStrip
          states={dayStates}
          selectedIndex={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-display-sm text-ink">
          {DAY_LABELS[selectedDay]}
        </h2>

        {dayWorkouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            clientId={clientId}
            planId={planId}
          />
        ))}

        <AddWorkoutForm clientId={clientId} planId={planId} dayOfWeek={selectedDay} />
      </div>
    </div>
  );
}

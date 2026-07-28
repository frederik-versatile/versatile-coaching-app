"use client";

import { useRef } from "react";
import { createWorkout } from "./actions";

export default function AddWorkoutForm({
  clientId,
  planId,
  dayOfWeek,
}: {
  clientId: string;
  planId: string;
  dayOfWeek: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createWorkout(formData);
        formRef.current?.reset();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="day_of_week" value={dayOfWeek} />
      <div className="space-y-1">
        <label htmlFor={`workout-name-${dayOfWeek}`} className="block text-caption text-charcoal">
          Workout name
        </label>
        <input
          id={`workout-name-${dayOfWeek}`}
          name="name"
          required
          className="w-full rounded border border-neutral bg-white px-2 py-1 text-body-sm text-ink focus:border-accent"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded border border-dashed border-neutral px-2 py-1 text-body-sm text-charcoal transition-colors hover:border-accent hover:text-accent"
      >
        + Add workout
      </button>
    </form>
  );
}

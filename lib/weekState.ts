export type DayState = "completed" | "skipped" | "rest" | "upcoming";

// Shared so both call sites (client dashboard, coach plan editor) derive the
// same day's state the same way. A day with no workout scheduled is "rest";
// a scheduled day favors showing completed > skipped > upcoming if it somehow
// has more than one workout logged differently.
//
// Kept out of components/WeekStrip.tsx: that file is "use client" (the strip
// is now also an interactive day-selector), and a "use client" module's
// exports become opaque component references across the server/client
// boundary -- a plain utility function like this one stops being callable
// from a Server Component if it lives there.
export function computeDayStates(
  workouts: { id: string; day_of_week: number }[],
  logsByWorkoutId: Record<string, { status: "completed" | "skipped" } | undefined>
): DayState[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const dayWorkouts = workouts.filter((w) => w.day_of_week === dayOfWeek);
    if (dayWorkouts.length === 0) return "rest";
    if (dayWorkouts.some((w) => logsByWorkoutId[w.id]?.status === "completed"))
      return "completed";
    if (dayWorkouts.some((w) => logsByWorkoutId[w.id]?.status === "skipped"))
      return "skipped";
    return "upcoming";
  });
}

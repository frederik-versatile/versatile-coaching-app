import { DAY_LABELS } from "@/lib/days";

export type DayState = "completed" | "skipped" | "rest" | "upcoming";

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

// Shared so both call sites (client dashboard, coach plan editor) derive the
// same day's state the same way. A day with no workout scheduled is "rest";
// a scheduled day favors showing completed > skipped > upcoming if it somehow
// has more than one workout logged differently.
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

// The one shared structural device tying every screen together: a compact
// Mon-Sun strip showing each day's real state via fill, not icons. Used
// wherever a training week is displayed or built (client dashboard, coach
// plan editor) so the same visual vocabulary means the same thing everywhere.
export default function WeekStrip({
  states,
  className,
}: {
  states: DayState[];
  className?: string;
}) {
  return (
    <div className={`flex gap-1.5 ${className ?? ""}`}>
      {states.map((state, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-caption text-charcoal">{DAY_INITIALS[i]}</span>
          <div
            role="img"
            aria-label={`${DAY_LABELS[i]}: ${STATE_LABEL[state]}`}
            className={`h-2 w-full rounded-full ${STATE_CLASS[state]}`}
          />
        </div>
      ))}
    </div>
  );
}

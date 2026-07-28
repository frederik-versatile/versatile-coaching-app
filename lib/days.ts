export const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// Next Monday on/after `from`, formatted as YYYY-MM-DD for a date input's
// defaultValue. JS Date.getDay() is 0=Sun..6=Sat, unlike the DB's 0=Mon..6=Sun.
export function upcomingMonday(from = new Date()): string {
  const day = from.getDay();
  const diff = (8 - day) % 7;
  const monday = new Date(from);
  monday.setDate(from.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

// The calendar date a workout falls on: week_start (a Monday) + day_of_week
// days (0=Mon..6=Sun), as YYYY-MM-DD.
export function dateForWeek(weekStart: string, dayOfWeek: number): string {
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dayOfWeek);
  return d.toISOString().slice(0, 10);
}

// Best-effort leading integer from a free-text reps range like "8-10" -> 8.
// Returns null if nothing parses, so the input starts blank instead of wrong.
export function parseLeadingInt(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

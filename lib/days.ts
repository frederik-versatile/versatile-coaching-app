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

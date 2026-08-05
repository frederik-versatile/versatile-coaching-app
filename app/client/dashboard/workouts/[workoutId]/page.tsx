import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLOR, type WorkoutType } from "@/lib/workoutTypes";
import WorkoutView from "../../WorkoutView";

export default async function ClientWorkoutPage({
  params,
}: {
  params: { workoutId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ("clients read own workouts") returns nothing if this workout isn't
  // actually one of this client's -- same notFound()-as-clean-response
  // pattern used everywhere else in the app.
  const { data: workout } = await supabase
    .from("workouts")
    .select(
      "id, name, workout_type, day_of_week, time_slot, sort_order, exercises(id, name, target_sets, target_reps, target_weight_kg, target_rir, target_rest_seconds, target_duration_minutes, target_distance_km, target_pace, notes, sort_order)"
    )
    .eq("id", params.workoutId)
    .single();

  if (!workout) notFound();

  const exercises = [...(workout.exercises || [])].sort((a, b) => a.sort_order - b.sort_order);
  const workoutType = workout.workout_type as WorkoutType;

  const { data: log } = await supabase
    .from("workout_logs")
    .select(
      "id, workout_id, log_date, status, notes, exercise_logs(id, exercise_id, set_number, reps, weight_kg)"
    )
    .eq("workout_id", params.workoutId)
    .eq("client_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/client/dashboard" className="text-body-sm text-accent hover:underline">
        ← Back to dashboard
      </Link>
      <span
        className={`inline-block w-fit rounded px-2 py-0.5 text-caption font-medium ${WORKOUT_TYPE_COLOR[workoutType]}`}
      >
        {WORKOUT_TYPE_LABELS[workoutType]}
      </span>
      <WorkoutView
        workout={{ ...workout, workout_type: workoutType, exercises }}
        existingLog={log}
        defaultExpanded
      />
    </main>
  );
}

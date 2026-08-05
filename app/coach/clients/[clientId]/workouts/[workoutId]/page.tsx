import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkoutInstanceEditor from "./WorkoutInstanceEditor";

export default async function WorkoutInstancePage({
  params,
}: {
  params: { clientId: string; workoutId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", params.clientId)
    .single();

  if (!client) notFound();

  // RLS ("coaches manage workouts for their clients") returns nothing if
  // this workout isn't actually one of this coach's linked clients' -- same
  // notFound()-as-clean-response pattern used everywhere else in the app.
  const { data: workout } = await supabase
    .from("workouts")
    .select(
      "id, name, workout_type, weekly_plan_id, exercises(id, name, target_sets, target_reps, target_weight_kg, target_rir, target_rest_seconds, target_duration_minutes, target_distance_km, target_pace, notes, sort_order)"
    )
    .eq("id", params.workoutId)
    .single();

  if (!workout) notFound();

  const exercises = [...(workout.exercises || [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <Link
        href={`/coach/clients/${params.clientId}?plan=${workout.weekly_plan_id}`}
        className="text-body-sm text-accent hover:underline"
      >
        ← Back to {client.full_name || "client"}
      </Link>
      <WorkoutInstanceEditor
        clientId={params.clientId}
        planId={workout.weekly_plan_id}
        workout={{
          id: workout.id,
          name: workout.name,
          workout_type: workout.workout_type,
          exercises,
        }}
      />
    </main>
  );
}

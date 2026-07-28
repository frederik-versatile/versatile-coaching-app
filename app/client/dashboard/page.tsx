import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import PlanAccordion from "./PlanAccordion";
import WeightLog from "./WeightLog";

export default async function ClientDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: plans } = await supabase
    .from("weekly_plans")
    .select(
      "id, week_start, notes, workouts(id, day_of_week, name, sort_order, exercises(id, name, target_sets, target_reps, target_weight_kg, notes, sort_order))"
    )
    .eq("client_id", user.id)
    .order("week_start", { ascending: false });

  // Sorted client-side rather than relying on nested-embed ordering syntax,
  // which PostgREST only reliably supports one level deep.
  const sortedPlans = (plans || []).map((plan) => ({
    ...plan,
    workouts: [...(plan.workouts || [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((workout) => ({
        ...workout,
        exercises: [...(workout.exercises || [])].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      })),
  }));

  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select(
      "id, workout_id, log_date, status, notes, exercise_logs(id, exercise_id, set_number, reps, weight_kg)"
    )
    .eq("client_id", user.id);

  // Plain object, not a Map: Map instances aren't serializable across the
  // server/client component boundary.
  const logsByWorkoutId = Object.fromEntries(
    (workoutLogs || []).map((log) => [log.workout_id, log])
  );

  const { data: weightLogs } = await supabase
    .from("weight_logs")
    .select("id, log_date, weight_kg")
    .eq("client_id", user.id)
    .order("log_date", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">
          Client Dashboard — logged in as {profile?.full_name || user.email}
        </h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-neutral px-4 py-2 text-ink hover:bg-white"
          >
            Sign out
          </button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-ink">Your weekly plans</h2>

        {sortedPlans.length === 0 ? (
          <p className="text-charcoal">No weekly plans yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedPlans.map((plan, i) => (
              <PlanAccordion
                key={plan.id}
                plan={plan}
                logsByWorkoutId={logsByWorkoutId}
                defaultExpanded={i === 0}
              />
            ))}
          </div>
        )}
      </section>

      <WeightLog entries={weightLogs || []} />
    </main>
  );
}

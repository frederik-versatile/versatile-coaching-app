import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DAY_LABELS } from "@/lib/days";
import { computeDayStates } from "@/components/WeekStrip";
import WorkoutCard from "./WorkoutCard";
import AddWorkoutForm from "./AddWorkoutForm";
import PlanHeader from "./PlanHeader";

export default async function WeeklyPlanPage({
  params,
}: {
  params: { clientId: string; planId: string };
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

  const { data: plan } = await supabase
    .from("weekly_plans")
    .select("id, week_start, notes")
    .eq("id", params.planId)
    .single();

  if (!plan) notFound();

  const { data: workouts } = await supabase
    .from("workouts")
    .select(
      "id, day_of_week, name, sort_order, exercises(id, name, target_sets, target_reps, target_weight_kg, notes, sort_order)"
    )
    .eq("weekly_plan_id", params.planId)
    .order("sort_order")
    .order("sort_order", { referencedTable: "exercises" });

  const workoutIds = (workouts || []).map((w) => w.id);
  const { data: workoutLogs, count: workoutLogCount } =
    workoutIds.length > 0
      ? await supabase
          .from("workout_logs")
          .select("id, workout_id, status", { count: "exact" })
          .in("workout_id", workoutIds)
      : { data: [], count: 0 };

  const logsByWorkoutId = Object.fromEntries(
    (workoutLogs || []).map((log) => [log.workout_id, log])
  );
  const dayStates = computeDayStates(workouts || [], logsByWorkoutId);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-12">
      <div className="space-y-3">
        <Link
          href={`/coach/clients/${params.clientId}`}
          className="text-body-sm text-accent hover:underline"
        >
          ← Back to {client.full_name || "client"}
        </Link>
        <PlanHeader
          clientId={params.clientId}
          planId={params.planId}
          weekStart={plan.week_start}
          notes={plan.notes}
          workoutLogCount={workoutLogCount ?? 0}
          dayStates={dayStates}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {DAY_LABELS.map((label, dayOfWeek) => {
          const dayWorkouts = (workouts || []).filter(
            (w) => w.day_of_week === dayOfWeek
          );

          return (
            <div key={label} className="space-y-3">
              <h2 className="font-display text-display-sm text-ink">{label}</h2>

              {dayWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  clientId={params.clientId}
                  planId={params.planId}
                />
              ))}

              <AddWorkoutForm
                clientId={params.clientId}
                planId={params.planId}
                dayOfWeek={dayOfWeek}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}

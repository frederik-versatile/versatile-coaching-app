import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signPhotoUrls } from "@/lib/photos";
import { computeDayStates } from "@/lib/weekState";
import ClientDetailTabs from "./ClientDetailTabs";
import type { MacroSplit, MealPlan } from "@/lib/nutrition";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ("coaches read linked clients' profiles") returns nothing if this
  // coach isn't actually linked to this client — that's the real boundary,
  // notFound() here is just a clean UI response to the same outcome.
  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", params.clientId)
    .single();

  if (!client) notFound();

  const { data: plans } = await supabase
    .from("weekly_plans")
    .select("id, week_start, notes")
    .eq("client_id", params.clientId)
    .order("week_start", { ascending: false });

  const planIds = (plans || []).map((p) => p.id);
  const { data: workouts } =
    planIds.length > 0
      ? await supabase
          .from("workouts")
          .select(
            "id, day_of_week, time_slot, workout_type, name, sort_order, weekly_plan_id, exercises(id, name, target_sets, target_reps, target_weight_kg, target_rir, target_rest_seconds, target_duration_minutes, target_distance_km, target_pace, notes, sort_order)"
          )
          .in("weekly_plan_id", planIds)
          .order("sort_order")
          .order("sort_order", { referencedTable: "exercises" })
      : { data: [] };

  // Coach-owned library, RLS-scoped -- used to populate WeekGrid's sidebar.
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id, name, workout_type, template_exercises(id)")
    .order("created_at", { ascending: false });

  const workoutIds = (workouts || []).map((w) => w.id);
  const { data: workoutLogs } =
    workoutIds.length > 0
      ? await supabase
          .from("workout_logs")
          .select("id, workout_id, status")
          .in("workout_id", workoutIds)
      : { data: [] };

  const logsByWorkoutId = Object.fromEntries(
    (workoutLogs || []).map((log) => [log.workout_id, log])
  );

  const dayStatesByPlanId = Object.fromEntries(
    (plans || []).map((plan) => [
      plan.id,
      computeDayStates(
        (workouts || []).filter((w) => w.weekly_plan_id === plan.id),
        logsByWorkoutId
      ),
    ])
  );

  const workoutLogCountByPlanId = Object.fromEntries(
    (plans || []).map((plan) => {
      const planWorkoutIds = (workouts || [])
        .filter((w) => w.weekly_plan_id === plan.id)
        .map((w) => w.id);
      const count = (workoutLogs || []).filter((log) =>
        planWorkoutIds.includes(log.workout_id)
      ).length;
      return [plan.id, count];
    })
  );

  // RLS ("coaches read linked clients' progress photos") scopes this to
  // exactly the linked client's rows; no delete/upload path exists here.
  const { data: photoRows } = await supabase
    .from("progress_photos")
    .select("id, storage_path, taken_date")
    .eq("client_id", params.clientId)
    .order("taken_date", { ascending: false });

  const photos = await signPhotoUrls(supabase, photoRows || []);

  const { data: macroSplits } = await supabase
    .from("macro_splits")
    .select("id, effective_date, calories, protein_g, carbs_g, fat_g")
    .eq("client_id", params.clientId)
    .order("effective_date", { ascending: false });

  const { data: mealPlans } = await supabase
    .from("meal_plans")
    .select("id, effective_date, content")
    .eq("client_id", params.clientId)
    .order("effective_date", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-12">
      <div>
        <Link href="/coach/dashboard" className="text-body-sm text-accent hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 font-display text-display-lg text-ink">
          {client.full_name || "Unnamed client"}
        </h1>
        <p className="text-body-sm text-charcoal">{client.email}</p>
      </div>

      {searchParams.error && (
        <p className="rounded border border-warning/30 bg-warning/10 px-3 py-2 text-body-sm text-warning">
          {searchParams.error}
        </p>
      )}

      <ClientDetailTabs
        clientId={params.clientId}
        plans={plans || []}
        workouts={workouts || []}
        templates={templates || []}
        dayStatesByPlanId={dayStatesByPlanId}
        workoutLogCountByPlanId={workoutLogCountByPlanId}
        photos={photos}
        macroSplits={(macroSplits || []) as MacroSplit[]}
        mealPlans={(mealPlans || []) as unknown as MealPlan[]}
      />
    </main>
  );
}

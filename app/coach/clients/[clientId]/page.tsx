import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { upcomingMonday } from "@/lib/days";
import { signPhotoUrls } from "@/lib/photos";
import { createWeeklyPlan } from "./actions";
import PhotoGrid from "@/app/client/dashboard/PhotoGrid";
import ProgressCharts from "@/app/client/dashboard/ProgressCharts";
import WeekStrip, { computeDayStates } from "@/components/WeekStrip";
import MacroSplitSection from "./MacroSplitSection";
import MealPlanSection from "./MealPlanSection";
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
  const { data: allWorkouts } =
    planIds.length > 0
      ? await supabase
          .from("workouts")
          .select("id, day_of_week, weekly_plan_id")
          .in("weekly_plan_id", planIds)
      : { data: [] };

  const workoutIds = (allWorkouts || []).map((w) => w.id);
  const { data: allLogs } =
    workoutIds.length > 0
      ? await supabase
          .from("workout_logs")
          .select("workout_id, status")
          .in("workout_id", workoutIds)
      : { data: [] };

  const logsByWorkoutId = Object.fromEntries(
    (allLogs || []).map((log) => [log.workout_id, log])
  );
  const dayStatesByPlanId = Object.fromEntries(
    (plans || []).map((plan) => [
      plan.id,
      computeDayStates(
        (allWorkouts || []).filter((w) => w.weekly_plan_id === plan.id),
        logsByWorkoutId
      ),
    ])
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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
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

      <section className="space-y-3">
        <h2 className="font-display text-display-sm text-ink">Weekly plans</h2>

        {!plans || plans.length === 0 ? (
          <p className="text-body text-charcoal">
            No weekly plans yet — build one below to get started.
          </p>
        ) : (
          <ul className="divide-y divide-neutral rounded border border-neutral bg-white">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/coach/clients/${params.clientId}/plans/${plan.id}`}
                  className="block space-y-2 px-4 py-3 transition-colors hover:bg-background"
                >
                  <span className="text-body text-ink">
                    Week of {plan.week_start}
                    {plan.notes && (
                      <span className="block text-body-sm text-charcoal">{plan.notes}</span>
                    )}
                  </span>
                  <WeekStrip states={dayStatesByPlanId[plan.id]} className="max-w-xs" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProgressCharts clientId={params.clientId} />

      <section className="space-y-3">
        <h2 className="font-display text-display-sm text-ink">Progress photos</h2>
        <PhotoGrid photos={photos} emptyMessage="No progress photos yet." />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-display-sm text-ink">Nutrition</h2>
        <MacroSplitSection
          clientId={params.clientId}
          macroSplits={(macroSplits || []) as MacroSplit[]}
        />
        <MealPlanSection
          clientId={params.clientId}
          mealPlans={(mealPlans || []) as unknown as MealPlan[]}
        />
      </section>

      <section className="space-y-3 rounded border border-neutral bg-white p-4">
        <h2 className="font-display text-display-sm text-ink">New weekly plan</h2>
        <form action={createWeeklyPlan} className="space-y-3">
          <input type="hidden" name="client_id" value={params.clientId} />

          <div className="space-y-1">
            <label htmlFor="week_start" className="block text-body-sm text-charcoal">
              Week start (Monday)
            </label>
            <input
              id="week_start"
              name="week_start"
              type="date"
              required
              defaultValue={upcomingMonday()}
              className="rounded border border-neutral px-3 py-2 font-mono text-data tabular-nums text-ink focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="notes" className="block text-body-sm text-charcoal">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-accent px-4 py-2 text-body font-medium text-white transition-colors hover:opacity-90"
          >
            Create weekly plan
          </button>
        </form>
      </section>
    </main>
  );
}

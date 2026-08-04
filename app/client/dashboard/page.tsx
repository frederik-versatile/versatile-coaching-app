import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { signPhotoUrls } from "@/lib/photos";
import WeekGridReadOnly from "./WeekGridReadOnly";
import WeightLog from "./WeightLog";
import PhotoUploadForm from "./PhotoUploadForm";
import PhotoGallery from "./PhotoGallery";
import ProgressCharts from "./ProgressCharts";
import NutritionView from "./NutritionView";
import { pickCurrent, type MacroSplit, type MealPlan } from "@/lib/nutrition";

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
      "id, week_start, notes, workouts(id, day_of_week, time_slot, workout_type, name, sort_order, exercises(id, name, target_sets, target_reps, target_weight_kg, target_rir, target_rest_seconds, target_duration_minutes, target_distance_km, target_pace, notes, sort_order))"
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

  const { data: photoRows } = await supabase
    .from("progress_photos")
    .select("id, storage_path, taken_date")
    .eq("client_id", user.id)
    .order("taken_date", { ascending: false });

  const photos = await signPhotoUrls(supabase, photoRows || []);

  const { data: macroSplits } = await supabase
    .from("macro_splits")
    .select("id, effective_date, calories, protein_g, carbs_g, fat_g")
    .eq("client_id", user.id)
    .order("effective_date", { ascending: false });

  const { data: mealPlans } = await supabase
    .from("meal_plans")
    .select("id, effective_date, content")
    .eq("client_id", user.id)
    .order("effective_date", { ascending: false });

  const currentMacros = pickCurrent((macroSplits || []) as MacroSplit[]);
  const currentMealPlan = pickCurrent(
    (mealPlans || []) as unknown as MealPlan[]
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-display-lg text-ink">
          {profile?.full_name || user.email}
        </h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border border-neutral px-4 py-2 text-body-sm text-ink transition-colors hover:bg-background"
          >
            Sign out
          </button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-display-sm text-ink">Your weekly plans</h2>

        {sortedPlans.length === 0 ? (
          <p className="text-body text-charcoal">
            No weekly plans yet — your coach will build one for you here.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedPlans.map((plan, i) => (
              <WeekGridReadOnly
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

      <ProgressCharts clientId={user.id} />

      <NutritionView
        currentMacros={currentMacros}
        currentMealPlan={currentMealPlan}
      />

      <section className="space-y-3">
        <h2 className="font-display text-display-sm text-ink">Progress photos</h2>
        <PhotoUploadForm clientId={user.id} />
        <PhotoGallery photos={photos} />
      </section>
    </main>
  );
}

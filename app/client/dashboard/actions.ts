"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dateForWeek } from "@/lib/days";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// Looks up the workout's own plan to derive log_date server-side, rather
// than trusting a week_start/day_of_week pair passed from the client.
async function resolveLogDate(
  supabase: ReturnType<typeof createClient>,
  workoutId: string
) {
  const { data: workout } = await supabase
    .from("workouts")
    .select("day_of_week, weekly_plans(week_start)")
    .eq("id", workoutId)
    .single();

  if (!workout) return null;
  const weeklyPlan = Array.isArray(workout.weekly_plans)
    ? workout.weekly_plans[0]
    : workout.weekly_plans;
  if (!weeklyPlan) return null;

  return dateForWeek(weeklyPlan.week_start, workout.day_of_week);
}

export async function logWorkoutSkipped(input: {
  workoutId: string;
  notes: string | null;
}) {
  const { supabase, user } = await requireUser();
  const logDate = await resolveLogDate(supabase, input.workoutId);
  if (!logDate) return;

  // RLS ("clients manage own workout logs") rejects this outright if
  // workoutId doesn't actually belong to a plan owned by this client.
  const { data: workoutLog } = await supabase
    .from("workout_logs")
    .upsert(
      {
        workout_id: input.workoutId,
        client_id: user.id,
        log_date: logDate,
        status: "skipped",
        notes: input.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workout_id,log_date" }
    )
    .select("id")
    .single();

  if (workoutLog) {
    // Clear any set data left over from a previous "completed" log.
    await supabase
      .from("exercise_logs")
      .delete()
      .eq("workout_log_id", workoutLog.id);
  }

  revalidatePath("/client/dashboard");
}

export async function logWorkoutCompleted(input: {
  workoutId: string;
  notes: string | null;
  sets: {
    exerciseId: string;
    setNumber: number;
    reps: number | null;
    weightKg: number | null;
  }[];
}) {
  const { supabase, user } = await requireUser();
  const logDate = await resolveLogDate(supabase, input.workoutId);
  if (!logDate) return;

  const { data: workoutLog } = await supabase
    .from("workout_logs")
    .upsert(
      {
        workout_id: input.workoutId,
        client_id: user.id,
        log_date: logDate,
        status: "completed",
        notes: input.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workout_id,log_date" }
    )
    .select("id")
    .single();

  if (workoutLog) {
    // Replace wholesale rather than diffing: simplest correct way to handle
    // sets being added/removed/reordered between edits.
    await supabase
      .from("exercise_logs")
      .delete()
      .eq("workout_log_id", workoutLog.id);

    if (input.sets.length > 0) {
      await supabase.from("exercise_logs").insert(
        input.sets.map((s) => ({
          workout_log_id: workoutLog.id,
          exercise_id: s.exerciseId,
          set_number: s.setNumber,
          reps: s.reps,
          weight_kg: s.weightKg,
        }))
      );
    }
  }

  revalidatePath("/client/dashboard");
}

export async function logWeight(input: { logDate: string; weightKg: number }) {
  const { supabase, user } = await requireUser();

  await supabase.from("weight_logs").upsert(
    {
      client_id: user.id,
      log_date: input.logDate,
      weight_kg: input.weightKg,
    },
    { onConflict: "client_id,log_date" }
  );

  revalidatePath("/client/dashboard");
}

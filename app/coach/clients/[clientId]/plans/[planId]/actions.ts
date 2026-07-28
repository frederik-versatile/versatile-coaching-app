"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function planPath(clientId: string, planId: string) {
  return `/coach/clients/${clientId}/plans/${planId}`;
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createWorkout(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const planId = formData.get("plan_id") as string;
  const dayOfWeek = Number(formData.get("day_of_week"));
  const name = formData.get("name") as string;

  const { supabase } = await requireUser();

  // No manual ownership check: "coaches manage workouts for their clients"
  // RLS rejects this insert if the coach isn't linked to this plan's client.
  const { count } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("weekly_plan_id", planId)
    .eq("day_of_week", dayOfWeek);

  await supabase.from("workouts").insert({
    weekly_plan_id: planId,
    day_of_week: dayOfWeek,
    name,
    sort_order: count ?? 0,
  });

  revalidatePath(planPath(clientId, planId));
}

export async function updateWorkout(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const planId = formData.get("plan_id") as string;
  const workoutId = formData.get("workout_id") as string;
  const dayOfWeek = Number(formData.get("day_of_week"));
  const name = formData.get("name") as string;

  const { supabase } = await requireUser();

  await supabase
    .from("workouts")
    .update({ name, day_of_week: dayOfWeek })
    .eq("id", workoutId);

  revalidatePath(planPath(clientId, planId));
}

export async function deleteWorkout(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const planId = formData.get("plan_id") as string;
  const workoutId = formData.get("workout_id") as string;

  const { supabase } = await requireUser();

  // Exercises cascade-delete via the FK, no separate cleanup needed.
  await supabase.from("workouts").delete().eq("id", workoutId);

  revalidatePath(planPath(clientId, planId));
}

export async function createExercise(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const planId = formData.get("plan_id") as string;
  const workoutId = formData.get("workout_id") as string;
  const name = formData.get("name") as string;
  const targetSets = formData.get("target_sets")
    ? Number(formData.get("target_sets"))
    : null;
  const targetReps = (formData.get("target_reps") as string) || null;
  const targetWeightKg = formData.get("target_weight_kg")
    ? Number(formData.get("target_weight_kg"))
    : null;
  const notes = (formData.get("notes") as string) || null;

  const { supabase } = await requireUser();

  const { count } = await supabase
    .from("exercises")
    .select("id", { count: "exact", head: true })
    .eq("workout_id", workoutId);

  await supabase.from("exercises").insert({
    workout_id: workoutId,
    name,
    target_sets: targetSets,
    target_reps: targetReps,
    target_weight_kg: targetWeightKg,
    notes,
    sort_order: count ?? 0,
  });

  revalidatePath(planPath(clientId, planId));
}

export async function updateExercise(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const planId = formData.get("plan_id") as string;
  const exerciseId = formData.get("exercise_id") as string;
  const name = formData.get("name") as string;
  const targetSets = formData.get("target_sets")
    ? Number(formData.get("target_sets"))
    : null;
  const targetReps = (formData.get("target_reps") as string) || null;
  const targetWeightKg = formData.get("target_weight_kg")
    ? Number(formData.get("target_weight_kg"))
    : null;
  const notes = (formData.get("notes") as string) || null;

  const { supabase } = await requireUser();

  await supabase
    .from("exercises")
    .update({
      name,
      target_sets: targetSets,
      target_reps: targetReps,
      target_weight_kg: targetWeightKg,
      notes,
    })
    .eq("id", exerciseId);

  revalidatePath(planPath(clientId, planId));
}

export async function deleteExercise(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const planId = formData.get("plan_id") as string;
  const exerciseId = formData.get("exercise_id") as string;

  const { supabase } = await requireUser();

  await supabase.from("exercises").delete().eq("id", exerciseId);

  revalidatePath(planPath(clientId, planId));
}

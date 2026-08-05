"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutType } from "@/lib/workoutTypes";

async function requireCoach() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function numOrNull(formData: FormData, key: string) {
  const raw = formData.get(key);
  return raw ? Number(raw) : null;
}

function textOrNull(formData: FormData, key: string) {
  return (formData.get(key) as string) || null;
}

export async function createWeeklyPlan(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const weekStart = formData.get("week_start") as string;
  const notes = (formData.get("notes") as string) || null;

  const { supabase, user } = await requireCoach();

  // No manual ownership check here: the "coaches manage their clients'
  // weekly plans" RLS policy rejects this insert outright if the coach
  // isn't linked to this client via coach_clients.
  const { error } = await supabase.from("weekly_plans").insert({
    client_id: clientId,
    week_start: weekStart,
    notes,
    created_by: user.id,
  });

  if (error) {
    redirect(
      `/coach/clients/${clientId}?error=${encodeURIComponent(
        error.message || "Could not create weekly plan."
      )}`
    );
  }

  // The new plan shows up in the Plan tab's own week switcher -- no separate
  // page to redirect into anymore.
  revalidatePath(`/coach/clients/${clientId}`);
  redirect(`/coach/clients/${clientId}`);
}

export async function updateWeeklyPlan(input: {
  planId: string;
  clientId: string;
  weekStart: string;
  notes: string | null;
}) {
  const { supabase } = await requireCoach();

  await supabase
    .from("weekly_plans")
    .update({ week_start: input.weekStart, notes: input.notes })
    .eq("id", input.planId);

  revalidatePath(`/coach/clients/${input.clientId}`);
}

export async function deleteWeeklyPlan(input: {
  planId: string;
  clientId: string;
}) {
  const { supabase } = await requireCoach();

  // Cascades to workouts -> exercises and, if any logs exist, to
  // workout_logs -> exercise_logs too. The UI is responsible for warning
  // about that before calling this — it's not re-checked here.
  await supabase.from("weekly_plans").delete().eq("id", input.planId);

  revalidatePath(`/coach/clients/${input.clientId}`);
}

// Copies a library template's exercises into new, independent workouts/
// exercises rows scheduled onto a specific day+slot of a specific plan.
// Deliberately a copy, not a live link: workout_logs/exercise_logs reference
// workouts.id/exercises.id directly, so editing the template later must
// never retroactively change something already scheduled or logged.
export async function scheduleTemplate(input: {
  clientId: string;
  planId: string;
  templateId: string;
  dayOfWeek: number;
  timeSlot: "am" | "midday" | "pm";
}) {
  const { supabase } = await requireCoach();

  const { data: template } = await supabase
    .from("workout_templates")
    .select(
      "id, name, workout_type, template_exercises(name, target_sets, target_reps, target_weight_kg, target_rir, target_rest_seconds, target_duration_minutes, target_distance_km, target_pace, notes, sort_order)"
    )
    .eq("id", input.templateId)
    .single();

  if (!template) {
    redirect(
      `/coach/clients/${input.clientId}?error=${encodeURIComponent(
        "That workout template couldn't be found."
      )}`
    );
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      weekly_plan_id: input.planId,
      day_of_week: input.dayOfWeek,
      time_slot: input.timeSlot,
      workout_type: template.workout_type,
      name: template.name,
      source_template_id: template.id,
    })
    .select("id")
    .single();

  if (workoutError || !workout) {
    redirect(
      `/coach/clients/${input.clientId}?error=${encodeURIComponent(
        workoutError?.message || "Could not schedule that workout."
      )}`
    );
  }

  const exerciseRows = (template.template_exercises || []).map((ex) => ({
    workout_id: workout.id,
    name: ex.name,
    target_sets: ex.target_sets,
    target_reps: ex.target_reps,
    target_weight_kg: ex.target_weight_kg,
    target_rir: ex.target_rir,
    target_rest_seconds: ex.target_rest_seconds,
    target_duration_minutes: ex.target_duration_minutes,
    target_distance_km: ex.target_distance_km,
    target_pace: ex.target_pace,
    notes: ex.notes,
    sort_order: ex.sort_order,
  }));

  if (exerciseRows.length > 0) {
    await supabase.from("exercises").insert(exerciseRows);
  }

  revalidatePath(`/coach/clients/${input.clientId}`);
}

// Rename only -- repositioning a workout onto a different day/slot happens
// by scheduling a new one via drag-and-drop, not by editing an existing
// scheduled workout's day_of_week/time_slot (no UI exposes that).
export async function updateWorkout(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const workoutId = formData.get("workout_id") as string;
  const name = formData.get("name") as string;

  const { supabase } = await requireCoach();

  await supabase.from("workouts").update({ name }).eq("id", workoutId);

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath(`/coach/clients/${clientId}/workouts/${workoutId}`);
}

export async function deleteWorkout(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const workoutId = formData.get("workout_id") as string;

  const { supabase } = await requireCoach();

  // Exercises cascade-delete via the FK, no separate cleanup needed.
  await supabase.from("workouts").delete().eq("id", workoutId);

  revalidatePath(`/coach/clients/${clientId}`);
}

export async function createExercise(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const workoutId = formData.get("workout_id") as string;
  const name = formData.get("name") as string;

  const { supabase } = await requireCoach();

  const { count } = await supabase
    .from("exercises")
    .select("id", { count: "exact", head: true })
    .eq("workout_id", workoutId);

  await supabase.from("exercises").insert({
    workout_id: workoutId,
    name,
    target_sets: numOrNull(formData, "target_sets"),
    target_reps: textOrNull(formData, "target_reps"),
    target_weight_kg: numOrNull(formData, "target_weight_kg"),
    target_rir: numOrNull(formData, "target_rir"),
    target_rest_seconds: numOrNull(formData, "target_rest_seconds"),
    target_duration_minutes: numOrNull(formData, "target_duration_minutes"),
    target_distance_km: numOrNull(formData, "target_distance_km"),
    target_pace: textOrNull(formData, "target_pace"),
    notes: textOrNull(formData, "notes"),
    sort_order: count ?? 0,
  });

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath(`/coach/clients/${clientId}/workouts/${workoutId}`);
}

export async function updateExercise(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const workoutId = formData.get("workout_id") as string;
  const exerciseId = formData.get("exercise_id") as string;
  const name = formData.get("name") as string;

  const { supabase } = await requireCoach();

  await supabase
    .from("exercises")
    .update({
      name,
      target_sets: numOrNull(formData, "target_sets"),
      target_reps: textOrNull(formData, "target_reps"),
      target_weight_kg: numOrNull(formData, "target_weight_kg"),
      target_rir: numOrNull(formData, "target_rir"),
      target_rest_seconds: numOrNull(formData, "target_rest_seconds"),
      target_duration_minutes: numOrNull(formData, "target_duration_minutes"),
      target_distance_km: numOrNull(formData, "target_distance_km"),
      target_pace: textOrNull(formData, "target_pace"),
      notes: textOrNull(formData, "notes"),
    })
    .eq("id", exerciseId);

  revalidatePath(`/coach/clients/${clientId}`);
  if (workoutId) revalidatePath(`/coach/clients/${clientId}/workouts/${workoutId}`);
}

export async function deleteExercise(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const workoutId = formData.get("workout_id") as string;
  const exerciseId = formData.get("exercise_id") as string;

  const { supabase } = await requireCoach();

  await supabase.from("exercises").delete().eq("id", exerciseId);

  revalidatePath(`/coach/clients/${clientId}`);
  if (workoutId) revalidatePath(`/coach/clients/${clientId}/workouts/${workoutId}`);
}

export type { WorkoutType };

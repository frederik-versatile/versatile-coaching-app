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

export async function createTemplate(formData: FormData) {
  const name = formData.get("name") as string;
  const workoutType = formData.get("workout_type") as WorkoutType;
  const notes = (formData.get("notes") as string) || null;

  const { supabase, user } = await requireCoach();

  // No manual ownership check: "coaches manage their own workout templates"
  // RLS requires coach_id = auth.uid() on the row being inserted.
  await supabase.from("workout_templates").insert({
    coach_id: user.id,
    name,
    workout_type: workoutType,
    notes,
  });

  revalidatePath("/coach/library");
}

export async function updateTemplate(input: {
  templateId: string;
  name: string;
  workoutType: WorkoutType;
  notes: string | null;
}) {
  const { supabase } = await requireCoach();

  await supabase
    .from("workout_templates")
    .update({ name: input.name, workout_type: input.workoutType, notes: input.notes })
    .eq("id", input.templateId);

  revalidatePath("/coach/library");
}

export async function deleteTemplate(templateId: string) {
  const { supabase } = await requireCoach();

  // template_exercises cascade-delete via the FK.
  await supabase.from("workout_templates").delete().eq("id", templateId);

  revalidatePath("/coach/library");
}

export async function createTemplateExercise(formData: FormData) {
  const templateId = formData.get("workout_template_id") as string;
  const name = formData.get("name") as string;

  const { supabase } = await requireCoach();

  const numOrNull = (key: string) => {
    const raw = formData.get(key);
    return raw ? Number(raw) : null;
  };
  const textOrNull = (key: string) => (formData.get(key) as string) || null;

  const { count } = await supabase
    .from("template_exercises")
    .select("id", { count: "exact", head: true })
    .eq("workout_template_id", templateId);

  await supabase.from("template_exercises").insert({
    workout_template_id: templateId,
    name,
    target_sets: numOrNull("target_sets"),
    target_reps: textOrNull("target_reps"),
    target_weight_kg: numOrNull("target_weight_kg"),
    target_rir: numOrNull("target_rir"),
    target_rest_seconds: numOrNull("target_rest_seconds"),
    target_duration_minutes: numOrNull("target_duration_minutes"),
    target_distance_km: numOrNull("target_distance_km"),
    target_pace: textOrNull("target_pace"),
    notes: textOrNull("notes"),
    sort_order: count ?? 0,
  });

  revalidatePath("/coach/library");
}

export async function updateTemplateExercise(formData: FormData) {
  const exerciseId = formData.get("template_exercise_id") as string;
  const name = formData.get("name") as string;

  const { supabase } = await requireCoach();

  const numOrNull = (key: string) => {
    const raw = formData.get(key);
    return raw ? Number(raw) : null;
  };
  const textOrNull = (key: string) => (formData.get(key) as string) || null;

  await supabase
    .from("template_exercises")
    .update({
      name,
      target_sets: numOrNull("target_sets"),
      target_reps: textOrNull("target_reps"),
      target_weight_kg: numOrNull("target_weight_kg"),
      target_rir: numOrNull("target_rir"),
      target_rest_seconds: numOrNull("target_rest_seconds"),
      target_duration_minutes: numOrNull("target_duration_minutes"),
      target_distance_km: numOrNull("target_distance_km"),
      target_pace: textOrNull("target_pace"),
      notes: textOrNull("notes"),
    })
    .eq("id", exerciseId);

  revalidatePath("/coach/library");
}

export async function deleteTemplateExercise(exerciseId: string) {
  const { supabase } = await requireCoach();

  await supabase.from("template_exercises").delete().eq("id", exerciseId);

  revalidatePath("/coach/library");
}

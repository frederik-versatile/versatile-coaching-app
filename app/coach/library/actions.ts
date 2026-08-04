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

// The only creation entry point now: "+ New Workout" always lands you
// straight inside the full-page editor with a default name/type to rename.
export async function createBlankTemplate() {
  const { supabase, user } = await requireCoach();

  const { data: template, error } = await supabase
    .from("workout_templates")
    .insert({ coach_id: user.id, name: "New Workout", workout_type: "strength" })
    .select("id")
    .single();

  if (error || !template) {
    redirect(
      `/coach/library?error=${encodeURIComponent(
        error?.message || "Could not create a new workout."
      )}`
    );
  }

  redirect(`/coach/library/${template.id}`);
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
  revalidatePath(`/coach/library/${input.templateId}`);
}

export async function deleteTemplate(templateId: string) {
  const { supabase } = await requireCoach();

  // template_sections -> template_exercises cascade-delete via the FKs.
  await supabase.from("workout_templates").delete().eq("id", templateId);

  revalidatePath("/coach/library");
}

export async function createSection(formData: FormData) {
  const templateId = formData.get("workout_template_id") as string;
  const name = formData.get("name") as string;

  const { supabase } = await requireCoach();

  const { count } = await supabase
    .from("template_sections")
    .select("id", { count: "exact", head: true })
    .eq("workout_template_id", templateId);

  await supabase.from("template_sections").insert({
    workout_template_id: templateId,
    name,
    sort_order: count ?? 0,
  });

  revalidatePath(`/coach/library/${templateId}`);
}

export async function updateSection(input: { sectionId: string; templateId: string; name: string }) {
  const { supabase } = await requireCoach();

  await supabase.from("template_sections").update({ name: input.name }).eq("id", input.sectionId);

  revalidatePath(`/coach/library/${input.templateId}`);
}

export async function deleteSection(input: { sectionId: string; templateId: string }) {
  const { supabase } = await requireCoach();

  // template_exercises in this section cascade-delete via the FK.
  await supabase.from("template_sections").delete().eq("id", input.sectionId);

  revalidatePath(`/coach/library/${input.templateId}`);
}

export async function createCatalogExercise(formData: FormData) {
  const name = formData.get("name") as string;
  const templateId = formData.get("template_id") as string;

  const { supabase, user } = await requireCoach();

  await supabase.from("exercise_catalog").insert({ coach_id: user.id, name });

  revalidatePath(`/coach/library/${templateId}`);
}

// Drag-and-drop landing action: called directly (object param, not FormData)
// from the catalog sidebar's drop handler, same pattern as scheduleTemplate.
export async function addCatalogExerciseToSection(input: {
  sectionId: string;
  templateId: string;
  catalogExerciseId: string;
}) {
  const { supabase } = await requireCoach();

  const { data: catalogExercise } = await supabase
    .from("exercise_catalog")
    .select("name")
    .eq("id", input.catalogExerciseId)
    .single();

  if (!catalogExercise) return;

  const { count } = await supabase
    .from("template_exercises")
    .select("id", { count: "exact", head: true })
    .eq("section_id", input.sectionId);

  await supabase.from("template_exercises").insert({
    workout_template_id: input.templateId,
    section_id: input.sectionId,
    name: catalogExercise.name,
    sort_order: count ?? 0,
  });

  revalidatePath(`/coach/library/${input.templateId}`);
}

export async function createTemplateExercise(formData: FormData) {
  const templateId = formData.get("workout_template_id") as string;
  const sectionId = formData.get("section_id") as string;
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
    .eq("section_id", sectionId);

  await supabase.from("template_exercises").insert({
    workout_template_id: templateId,
    section_id: sectionId,
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

  revalidatePath(`/coach/library/${templateId}`);
}

export async function updateTemplateExercise(formData: FormData) {
  const templateId = formData.get("template_id") as string;
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

  revalidatePath(`/coach/library/${templateId}`);
}

export async function deleteTemplateExercise(input: { exerciseId: string; templateId: string }) {
  const { supabase } = await requireCoach();

  await supabase.from("template_exercises").delete().eq("id", input.exerciseId);

  revalidatePath(`/coach/library/${input.templateId}`);
}

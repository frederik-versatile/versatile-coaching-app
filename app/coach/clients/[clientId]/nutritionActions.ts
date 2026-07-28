"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MealBlock } from "@/lib/nutrition";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createMacroSplit(input: {
  clientId: string;
  effectiveDate: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}) {
  const { supabase, user } = await requireUser();

  // set_by is always the caller's own id — never accepted from client input.
  // RLS ("coaches manage their clients' macro splits") rejects this outright
  // if the coach isn't actually linked to this client.
  await supabase.from("macro_splits").insert({
    client_id: input.clientId,
    effective_date: input.effectiveDate,
    calories: input.calories,
    protein_g: input.proteinG,
    carbs_g: input.carbsG,
    fat_g: input.fatG,
    set_by: user.id,
  });

  revalidatePath(`/coach/clients/${input.clientId}`);
}

export async function updateMacroSplit(input: {
  id: string;
  clientId: string;
  effectiveDate: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}) {
  const { supabase } = await requireUser();

  await supabase
    .from("macro_splits")
    .update({
      effective_date: input.effectiveDate,
      calories: input.calories,
      protein_g: input.proteinG,
      carbs_g: input.carbsG,
      fat_g: input.fatG,
    })
    .eq("id", input.id);

  revalidatePath(`/coach/clients/${input.clientId}`);
}

export async function deleteMacroSplit(input: {
  id: string;
  clientId: string;
}) {
  const { supabase } = await requireUser();

  await supabase.from("macro_splits").delete().eq("id", input.id);

  revalidatePath(`/coach/clients/${input.clientId}`);
}

export async function createMealPlan(input: {
  clientId: string;
  effectiveDate: string;
  content: MealBlock[];
}) {
  const { supabase, user } = await requireUser();

  await supabase.from("meal_plans").insert({
    client_id: input.clientId,
    effective_date: input.effectiveDate,
    content: input.content,
    set_by: user.id,
  });

  revalidatePath(`/coach/clients/${input.clientId}`);
}

export async function updateMealPlan(input: {
  id: string;
  clientId: string;
  effectiveDate: string;
  content: MealBlock[];
}) {
  const { supabase } = await requireUser();

  await supabase
    .from("meal_plans")
    .update({
      effective_date: input.effectiveDate,
      content: input.content,
    })
    .eq("id", input.id);

  revalidatePath(`/coach/clients/${input.clientId}`);
}

export async function deleteMealPlan(input: { id: string; clientId: string }) {
  const { supabase } = await requireUser();

  await supabase.from("meal_plans").delete().eq("id", input.id);

  revalidatePath(`/coach/clients/${input.clientId}`);
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createWeeklyPlan(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const weekStart = formData.get("week_start") as string;
  const notes = (formData.get("notes") as string) || null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // No manual ownership check here: the "coaches manage their clients'
  // weekly plans" RLS policy rejects this insert outright if the coach
  // isn't linked to this client via coach_clients.
  const { data: plan, error } = await supabase
    .from("weekly_plans")
    .insert({
      client_id: clientId,
      week_start: weekStart,
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !plan) {
    redirect(
      `/coach/clients/${clientId}?error=${encodeURIComponent(
        error?.message || "Could not create weekly plan."
      )}`
    );
  }

  redirect(`/coach/clients/${clientId}/plans/${plan.id}`);
}

export async function updateWeeklyPlan(input: {
  planId: string;
  clientId: string;
  weekStart: string;
  notes: string | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("weekly_plans")
    .update({ week_start: input.weekStart, notes: input.notes })
    .eq("id", input.planId);

  revalidatePath(`/coach/clients/${input.clientId}/plans/${input.planId}`);
}

export async function deleteWeeklyPlan(input: {
  planId: string;
  clientId: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cascades to workouts -> exercises and, if any logs exist, to
  // workout_logs -> exercise_logs too. The UI is responsible for warning
  // about that before calling this — it's not re-checked here.
  await supabase.from("weekly_plans").delete().eq("id", input.planId);

  revalidatePath(`/coach/clients/${input.clientId}`);
  redirect(`/coach/clients/${input.clientId}`);
}

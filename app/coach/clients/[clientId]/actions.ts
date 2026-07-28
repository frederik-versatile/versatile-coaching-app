"use server";

import { redirect } from "next/navigation";
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

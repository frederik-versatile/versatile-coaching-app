"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProgressPoint = { logDate: string; value: number };

// Takes an explicit clientId rather than assuming "the caller's own id" so
// the same action serves both the client's own dashboard and the coach's
// view of a linked client — RLS ("clients manage own" / "coaches read
// linked clients'") decides what actually comes back either way.
export async function getProgressData(
  clientId: string,
  days: number
): Promise<{ weight: ProgressPoint[]; volume: ProgressPoint[] }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const [{ data: weightRows }, { data: volumeRows }] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("log_date, weight_kg")
      .eq("client_id", clientId)
      .gte("log_date", cutoffStr)
      .order("log_date"),
    supabase
      .from("daily_volume")
      .select("log_date, volume_kg")
      .eq("client_id", clientId)
      .gte("log_date", cutoffStr)
      .order("log_date"),
  ]);

  return {
    weight: (weightRows || []).map((r) => ({
      logDate: r.log_date,
      value: r.weight_kg,
    })),
    volume: (volumeRows || []).map((r) => ({
      logDate: r.log_date,
      value: r.volume_kg,
    })),
  };
}

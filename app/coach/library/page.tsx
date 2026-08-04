import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LibraryGrid from "./LibraryGrid";

export default async function LibraryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ("coaches manage their own workout templates") already scopes this
  // to exactly this coach's templates -- no manual filter needed.
  const { data: templates } = await supabase
    .from("workout_templates")
    .select(
      "id, name, workout_type, notes, template_exercises(id, name, target_sets, target_reps, target_weight_kg, target_rir, target_rest_seconds, target_duration_minutes, target_distance_km, target_pace, notes, sort_order)"
    )
    .order("created_at", { ascending: false })
    .order("sort_order", { referencedTable: "template_exercises" });

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/coach/dashboard" className="text-body-sm text-accent hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 font-display text-display-lg text-ink">Library</h1>
        </div>
      </div>

      <LibraryGrid templates={templates || []} />
    </main>
  );
}

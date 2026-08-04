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
  // to exactly this coach's templates -- no manual filter needed. Only the
  // exercise id is fetched, purely for the card's exercise-count badge; full
  // exercise detail is only needed inside the per-template editor page.
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id, name, workout_type, template_exercises(id)")
    .order("created_at", { ascending: false });

  const templateSummaries = (templates || []).map((t) => ({
    id: t.id,
    name: t.name,
    workout_type: t.workout_type,
    exerciseCount: t.template_exercises?.length ?? 0,
  }));

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

      <LibraryGrid templates={templateSummaries} />
    </main>
  );
}

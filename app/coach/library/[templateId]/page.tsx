import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TemplateEditor from "./TemplateEditor";

export default async function TemplateEditorPage({
  params,
}: {
  params: { templateId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ("coaches manage their own workout templates") returns nothing if
  // this template isn't this coach's -- notFound() is just a clean UI
  // response to that same outcome.
  const { data: template } = await supabase
    .from("workout_templates")
    .select("id, name, workout_type, notes, tag")
    .eq("id", params.templateId)
    .single();

  if (!template) notFound();

  const { data: sectionsRaw } = await supabase
    .from("template_sections")
    .select(
      "id, name, sort_order, template_exercises(id, name, target_sets, target_reps, target_weight_kg, target_rir, target_rest_seconds, target_duration_minutes, target_distance_km, target_pace, notes, sort_order, superset_group)"
    )
    .eq("workout_template_id", params.templateId);

  // Sorted client-side: PostgREST only reliably orders one level of nested
  // embed, same limitation already worked around in app/client/dashboard/page.tsx.
  const sections = (sectionsRaw || [])
    .map((section) => ({
      ...section,
      template_exercises: [...(section.template_exercises || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const { data: catalog } = await supabase
    .from("exercise_catalog")
    .select("id, name")
    .order("name");

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-12">
      <Link href="/coach/library" className="text-body-sm text-accent hover:underline">
        ← Back to Library
      </Link>
      <TemplateEditor template={template} sections={sections} catalog={catalog || []} />
    </main>
  );
}

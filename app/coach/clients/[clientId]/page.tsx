import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { upcomingMonday } from "@/lib/days";
import { createWeeklyPlan } from "./actions";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ("coaches read linked clients' profiles") returns nothing if this
  // coach isn't actually linked to this client — that's the real boundary,
  // notFound() here is just a clean UI response to the same outcome.
  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", params.clientId)
    .single();

  if (!client) notFound();

  const { data: plans } = await supabase
    .from("weekly_plans")
    .select("id, week_start, notes")
    .eq("client_id", params.clientId)
    .order("week_start", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div>
        <Link href="/coach/dashboard" className="text-sm text-accent hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          {client.full_name || "Unnamed client"}
        </h1>
      </div>

      {searchParams.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-ink">Weekly plans</h2>

        {!plans || plans.length === 0 ? (
          <p className="text-charcoal">No weekly plans yet.</p>
        ) : (
          <ul className="divide-y divide-neutral rounded-lg border border-neutral bg-white">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/coach/clients/${params.clientId}/plans/${plan.id}`}
                  className="block px-4 py-3 text-ink hover:bg-background"
                >
                  Week of {plan.week_start}
                  {plan.notes && (
                    <span className="block text-sm text-charcoal">{plan.notes}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-neutral bg-white p-4">
        <h2 className="text-lg font-medium text-ink">New weekly plan</h2>
        <form action={createWeeklyPlan} className="space-y-3">
          <input type="hidden" name="client_id" value={params.clientId} />

          <div className="space-y-1">
            <label htmlFor="week_start" className="block text-sm text-charcoal">
              Week start (Monday)
            </label>
            <input
              id="week_start"
              name="week_start"
              type="date"
              required
              defaultValue={upcomingMonday()}
              className="rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="notes" className="block text-sm text-charcoal">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
          >
            Create weekly plan
          </button>
        </form>
      </section>
    </main>
  );
}

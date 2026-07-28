import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { inviteClient } from "./actions";

function latestByClient(rows: { client_id: string; created_at: string }[]) {
  const map = new Map<string, string>();
  for (const row of rows) {
    // Rows arrive ordered newest-first, so the first hit per client is their
    // most recent one — no need to compare timestamps here.
    if (!map.has(row.client_id)) map.set(row.client_id, row.created_at);
  }
  return map;
}

function formatLastActive(iso: string | null): string {
  if (!iso) return "No activity yet";
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Active today";
  if (days === 1) return "Active yesterday";
  return `Active ${days} days ago`;
}

export default async function CoachDashboard({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // RLS ("coaches read linked clients' profiles") already scopes this to
  // exactly the clients linked to this coach — the .eq("role", "client")
  // filter below is just belt-and-braces clarity, not the security boundary.
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "client")
    .order("full_name");

  const clientIds = (clients || []).map((c) => c.id);

  const [{ data: workoutLogRows }, { data: weightLogRows }] =
    clientIds.length > 0
      ? await Promise.all([
          supabase
            .from("workout_logs")
            .select("client_id, created_at")
            .in("client_id", clientIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("weight_logs")
            .select("client_id, created_at")
            .in("client_id", clientIds)
            .order("created_at", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }];

  const workoutLatest = latestByClient(workoutLogRows || []);
  const weightLatest = latestByClient(weightLogRows || []);

  const lastActiveByClient = new Map<string, string | null>();
  for (const id of clientIds) {
    const candidates = [workoutLatest.get(id), weightLatest.get(id)].filter(
      (v): v is string => Boolean(v)
    );
    lastActiveByClient.set(
      id,
      candidates.length > 0 ? candidates.sort().reverse()[0] : null
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-display-lg text-ink">
          {profile?.full_name || user.email}
        </h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border border-neutral px-4 py-2 text-body-sm text-ink transition-colors hover:bg-background"
          >
            Sign out
          </button>
        </form>
      </div>

      {searchParams.error && (
        <p className="rounded border border-warning/30 bg-warning/10 px-3 py-2 text-body-sm text-warning">
          {searchParams.error}
        </p>
      )}
      {searchParams.success && (
        <p className="rounded border border-success/30 bg-success/10 px-3 py-2 text-body-sm text-success">
          {searchParams.success}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-display-sm text-ink">Your clients</h2>

        {!clients || clients.length === 0 ? (
          <p className="text-body text-charcoal">
            No clients yet — invite one below to get started.
          </p>
        ) : (
          <ul className="divide-y divide-neutral rounded border border-neutral bg-white">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/coach/clients/${client.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-background"
                >
                  <span>
                    <span className="block text-body text-ink">
                      {client.full_name || "Unnamed client"}
                    </span>
                    <span className="block text-caption text-charcoal">
                      {client.email}
                    </span>
                  </span>
                  <span className="text-body-sm text-charcoal">
                    {formatLastActive(lastActiveByClient.get(client.id) ?? null)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded border border-neutral bg-white p-4">
        <h2 className="font-display text-display-sm text-ink">Add client</h2>
        <form action={inviteClient} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="full_name" className="block text-body-sm text-charcoal">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-body-sm text-charcoal">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-accent px-4 py-2 text-body font-medium text-white transition-colors hover:opacity-90"
          >
            Send invite
          </button>
        </form>
      </section>
    </main>
  );
}

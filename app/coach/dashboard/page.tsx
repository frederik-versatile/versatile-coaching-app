import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function CoachDashboard() {
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
    .select("id, full_name")
    .eq("role", "client")
    .order("full_name");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">
          Coach Dashboard — logged in as {profile?.full_name || user.email}
        </h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-neutral px-4 py-2 text-ink hover:bg-white"
          >
            Sign out
          </button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-ink">Your clients</h2>

        {!clients || clients.length === 0 ? (
          <p className="text-charcoal">
            No clients linked yet. Client invites aren&apos;t built yet — a
            coach_clients row has to be created manually for now.
          </p>
        ) : (
          <ul className="divide-y divide-neutral rounded-lg border border-neutral bg-white">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/coach/clients/${client.id}`}
                  className="block px-4 py-3 text-ink hover:bg-background"
                >
                  {client.full_name || "Unnamed client"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

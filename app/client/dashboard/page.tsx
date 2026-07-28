import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function ClientDashboard() {
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-ink">
        Client Dashboard — logged in as {profile?.full_name || user.email}
      </h1>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-neutral px-4 py-2 text-ink hover:bg-white"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}

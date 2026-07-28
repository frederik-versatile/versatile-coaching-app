import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "coach") redirect("/coach/dashboard");
    if (profile?.role === "client") redirect("/client/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-display text-display-xl text-ink">Versatile Coaching</h1>
      <p className="max-w-md text-body text-charcoal">
        Training plans and progress tracking for coaches and clients.
      </p>
      <Link
        href="/login"
        className="rounded bg-accent px-5 py-2 text-body font-medium text-white transition-colors hover:opacity-90"
      >
        Log in
      </Link>
    </main>
  );
}

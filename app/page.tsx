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
      <h1 className="text-3xl font-semibold text-ink">Versatile Coaching</h1>
      <p className="max-w-md text-charcoal">
        Training plans and progress tracking for coaches and clients.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md border border-neutral px-5 py-2 text-ink hover:bg-white"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-accent px-5 py-2 font-medium text-white hover:opacity-90"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}

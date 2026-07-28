"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consented, setConsented] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // The invite link's token is consumed by the browser client itself as
    // soon as it's instantiated (detectSessionInUrl, on by default) — by the
    // time this resolves, either a session exists or the link was bad/expired.
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        setError(
          "This invite link is invalid or has expired. Ask your coach to send a new one."
        );
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!consented) {
      setError("You must accept the privacy policy to continue.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ privacy_accepted_at: new Date().toISOString() })
        .eq("id", user.id);
    }
    setSaving(false);

    // Root page handles role-based routing from here (Phase 0) — no new
    // routing logic needed for the invited client to land correctly.
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Set your password</h1>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm text-charcoal">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm" className="block text-sm text-charcoal">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex items-start gap-2">
              <input
                id="consent"
                type="checkbox"
                required
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="consent" className="text-sm text-charcoal">
                I have read and accept the{" "}
                <Link href="/privacy" target="_blank" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Set password"}
            </button>
          </form>
        ) : (
          !error && <p className="text-charcoal">Checking your invite…</p>
        )}
      </div>
    </main>
  );
}

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
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");

    async function establishSession() {
      if (code) {
        // PKCE flow (the default for @supabase/ssr's browser client): the
        // invite/recovery link carries a `code` query param that must be
        // explicitly exchanged for a session -- unlike the older hash-token
        // flow, this isn't handled automatically by detectSessionInUrl.
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(
            "This invite link is invalid or has expired. Ask your coach to send a new one."
          );
          return;
        }
        setReady(true);
        return;
      }

      // Fallback: hash-based token flow, already consumed automatically by
      // detectSessionInUrl (on by default) by the time this resolves.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      } else {
        setError(
          "This invite link is invalid or has expired. Ask your coach to send a new one."
        );
      }
    }

    establishSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match — check both fields and try again.");
      return;
    }
    if (!consented) {
      setError("Accept the privacy policy to continue.");
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
      <div className="w-full max-w-sm space-y-4 rounded border border-neutral bg-white p-8">
        <h1 className="font-display text-display text-ink">Set your password</h1>

        {error && (
          <p className="rounded border border-warning/30 bg-warning/10 px-3 py-2 text-body-sm text-warning">
            {error}
          </p>
        )}

        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password" className="block text-body-sm text-charcoal">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm" className="block text-body-sm text-charcoal">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
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
              <label htmlFor="consent" className="text-body-sm text-charcoal">
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
              className="w-full rounded bg-accent px-4 py-2 text-body font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Setting password…" : "Set password"}
            </button>
          </form>
        ) : (
          !error && <p className="text-body text-charcoal">Checking your invite…</p>
        )}
      </div>
    </main>
  );
}

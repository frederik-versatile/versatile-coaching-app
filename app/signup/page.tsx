import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm space-y-4 rounded border border-neutral bg-white p-8">
        <h1 className="font-display text-display text-ink">Accounts are by invitation</h1>
        <p className="text-body text-charcoal">
          Your coach sends you an invite by email to set up your account —
          there&apos;s no public sign-up here.
        </p>
        <Link
          href="/login"
          className="inline-block rounded bg-accent px-4 py-2 text-body font-medium text-white transition-colors hover:opacity-90"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}

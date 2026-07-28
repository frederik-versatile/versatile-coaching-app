import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Accounts are by invitation</h1>
        <p className="text-charcoal">
          Your coach sends you an invite by email to set up your account —
          there&apos;s no public sign-up here.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}

import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded border border-neutral bg-white p-8"
      >
        <h1 className="font-display text-display text-ink">Log in</h1>

        {searchParams.error && (
          <p className="rounded border border-warning/30 bg-warning/10 px-3 py-2 text-body-sm text-warning">
            {searchParams.error}
          </p>
        )}

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

        <div className="space-y-1">
          <label htmlFor="password" className="block text-body-sm text-charcoal">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-accent px-4 py-2 text-body font-medium text-white transition-colors hover:opacity-90"
        >
          Log in
        </button>
      </form>
    </main>
  );
}

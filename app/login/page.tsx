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
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-ink">Log in</h1>

        {searchParams.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm text-charcoal">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm text-charcoal">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Log in
        </button>
      </form>
    </main>
  );
}

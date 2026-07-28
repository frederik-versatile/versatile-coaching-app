import Link from "next/link";
import { signup } from "./actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={signup}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-ink">Sign up</h1>

        {searchParams.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="full_name" className="block text-sm text-charcoal">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full rounded-md border border-neutral px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>

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

        <fieldset className="space-y-2">
          <legend className="text-sm text-charcoal">I am a...</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-ink">
              <input type="radio" name="role" value="client" defaultChecked />
              Client
            </label>
            <label className="flex items-center gap-2 text-ink">
              <input type="radio" name="role" value="coach" />
              Coach
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Sign up
        </button>

        <p className="text-center text-sm text-charcoal">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}

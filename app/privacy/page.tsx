import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/" className="text-body-sm text-accent hover:underline">
        ← Back
      </Link>

      <div className="space-y-4 rounded border-2 border-dashed border-warning/40 bg-warning/10 p-6">
        <h1 className="font-display text-display-lg text-ink">Privacy Policy</h1>
        <p className="text-body font-medium text-warning">
          Placeholder — not the real policy yet.
        </p>
        <p className="text-body text-charcoal">
          This page is a stand-in so the app has a working /privacy link and
          consent checkbox in place. The actual GDPR-aware privacy policy
          text has not been drafted yet and will replace this placeholder
          before real client data is collected under it.
        </p>
      </div>
    </main>
  );
}

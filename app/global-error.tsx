"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-background font-body text-body">
        <main className="flex min-h-screen items-center justify-center px-4 text-center">
          <div className="space-y-2">
            <h1 className="font-display text-display text-ink">This page hit an error</h1>
            <p className="text-body text-charcoal">
              It&apos;s been reported. Reload the page, or try again in a moment.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}

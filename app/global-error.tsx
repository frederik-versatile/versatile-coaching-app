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
      <body>
        <main className="flex min-h-screen items-center justify-center px-4 text-center">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
            <p className="text-charcoal">
              This has been reported. Please try again.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}

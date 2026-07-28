import * as Sentry from "@sentry/nextjs";

const dsn =
  "https://ec0838ffefbc2e947d9aa0af4f6926a2@o4511814346145792.ingest.de.sentry.io/4511814355779664";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({ dsn, tracesSampleRate: 1.0 });
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({ dsn, tracesSampleRate: 1.0 });
  }
}

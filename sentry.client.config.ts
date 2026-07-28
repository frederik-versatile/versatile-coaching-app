import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://ec0838ffefbc2e947d9aa0af4f6926a2@o4511814346145792.ingest.de.sentry.io/4511814355779664",
  tracesSampleRate: 1.0,
});

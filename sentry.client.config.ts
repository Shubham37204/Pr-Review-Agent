import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance tracing
  tracesSampleRate:
    process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment tagging (VERY useful in dashboards)
  environment: process.env.NODE_ENV,

  // Enable debug logs only in dev
  debug: process.env.NODE_ENV === "development",

  // Optional but highly recommended 👇
  integrations: [
    Sentry.replayIntegration(),
  ],
});

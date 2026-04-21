import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance tracing
  tracesSampleRate:
    process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Dev-only debugging tool (shows events in browser devtools)
  spotlight: process.env.NODE_ENV === "development",

  // Tag environment (very important for filtering in Sentry UI)
  environment: process.env.NODE_ENV,

  // Debug logs only in dev
  debug: process.env.NODE_ENV === "development",
});

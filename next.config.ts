import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silence logs in CI/CD
  silent: !process.env.CI,

  // Remove Sentry logger from production bundle (smaller bundle)
  disableLogger: true,

  // Automatically tree-shake Sentry logger statements
  // sourcemaps replaces the old hideSourceMaps option
  sourcemaps: {
    disable: false,
  },
});
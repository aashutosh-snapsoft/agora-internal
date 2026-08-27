// Client-side Sentry initialization.
// Runs whenever a user loads a page in their browser.
// Migrated from the legacy `sentry.client.config.ts` to the Next.js
// `instrumentation-client.ts` convention (required for Turbopack; the legacy
// file is not loaded under `next dev --turbopack`).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5316ffaf0f3b1ea505835a1031e0414a@o4508208259596288.ingest.us.sentry.io/4508230713081856",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Session Replay sampling — sessions off; on-error off.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// Instruments App Router navigations (pageload/navigation transactions).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

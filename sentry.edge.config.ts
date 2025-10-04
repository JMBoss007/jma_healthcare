// sentry.edge.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5338f71131136941af1eb82aaa86cde8@o4510128902832128.ingest.us.sentry.io/4510128905781248",

  tracesSampleRate: 1,
  enableLogs: true,
  debug: false,

  // ✅ Enable metrics aggregator for Edge runtime
  _experiments: {
    metricsAggregator: true,
  },
});

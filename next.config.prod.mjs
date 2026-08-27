import { withSentryConfig } from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: [
      'src',
      '!src/external/essence/app',
      '!src/external/essence/page-sections'
    ],
  },
  output: 'standalone',
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\/(unwanted-folder)\//,
        contextRegExp: /src\/external\/essence\/(app|page-sections)/,
      })
    );

    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/src/external/essence/app/**',
        '**/src/external/essence/page-sections/**'
      ]
    };

    return config;
  },
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/projects",
        permanent: true,

      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "socraticsai",
  project: "agora",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: false,

  // v9+ no longer falls back to the Next.js build ID for the release name.
  // Set it from SENTRY_RELEASE (CI exports the deploy SHA). When unset (e.g.
  // local dev) `name` is intentionally `undefined` — this is NOT a bug: the
  // Sentry plugin then falls back to git auto-detection.
  release: {
    name: process.env.SENTRY_RELEASE,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // hideSourceMaps was removed in v9 (client builds emit hidden-source-map by
  // default). reactComponentAnnotation/disableLogger/automaticVercelMonitors
  // moved under `webpack.*` in v9/v10. NOTE: these only apply to the webpack
  // build (`next build`); they have no effect under `next dev --turbopack`.
  webpack: {
    // Annotate React components in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: false,
    },
    // Tree-shake Sentry logger statements to reduce bundle size (was disableLogger)
    treeshake: {
      removeDebugLogging: true,
    },
    // Automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: false,
  },
});

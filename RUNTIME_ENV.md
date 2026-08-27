# Environment Variables (Build vs Runtime)

This project currently uses build-time injection for `NEXT_PUBLIC_*` variables. Runtime placeholder
replacement is not enabled by default.

## How It Works

1. The Docker build uses build args to set `NEXT_PUBLIC_*` values (see `Dockerfile`).
2. Next.js inlines `NEXT_PUBLIC_*` values into client bundles at build time.
3. Server-only variables (such as `AUTH0_*` and `HASURA_ADMIN_SECRET`) are read at runtime by server code.

The entrypoint script does not modify built files.

## Build-Time (Client) Variables

The Docker build accepts and inlines these values:

- `NEXT_PUBLIC_URL`
- `NEXT_PUBLIC_LOGOS_URL`
- `NEXT_PUBLIC_GRAPHQL_URL`
- `NEXT_PUBLIC_AUTH0_DOMAIN`
- `NEXT_PUBLIC_AUTH0_CLIENT_ID`
- `NEXT_PUBLIC_AUTH0_REDIRECT_URI`
- `NEXT_PUBLIC_AUTH0_AUDIENCE`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_AMPLITUDE_API_KEY`

## Runtime (Server) Variables

These values are read at runtime by the Next.js server:

- `AUTH0_SECRET`
- `AUTH0_BASE_URL`
- `AUTH0_ISSUER_BASE_URL`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_AUDIENCE`
- `HASURA_ADMIN_SECRET`
- `AZURE_STORAGE_ACCOUNT` — the storage account backing `/api/projects/*`
  container creation. Was dev-only (empty in prod, since the whole feature was
  demo-flagged); now required in **every** environment, since `/projects` is
  the real, permanently-live route (PR #569). **Blocking as of this PR**: prod
  has no value configured yet — see `.github/workflows/deploy-agora-vnet.yml`'s
  `PROD_AZURE_STORAGE_ACCOUNT` TODO.

### Retired variables

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `DEMO_WS_PSK`, `DEMO_ROUTE_TOKEN`,
  `DEMO_STAGING_ENABLED` — **no longer used by Agora.** These backed the
  demo-staging surface (`/demo/<token>`, `/api/demo/<token>/**`, and its
  WebSocket transport). Its projects/upload flow was promoted to the real
  `/projects` route; the rest (chat, processing-run tracking, the Telegram and
  WebSocket transports) was dropped rather than rebuilt — the intended
  replacement is a hand-off into the Ares/Theia workspace, not yet wired up.
  Safe to remove these vars from Agora's environment.

## Local Development

- For local Next.js dev: copy `.env.template` to `.env.local` and fill in values.
- For Docker Compose: copy `.env.template` to `.env.development.local` (compose mounts it to `/app/.env.local`).

## Production Deployment

- Build with build args for `NEXT_PUBLIC_*` (as in `Dockerfile` or the deploy workflows).
- Pass server secrets at runtime (for example via container environment variables or Azure secrets).

## Adding New Environment Variables

1. Add the variable to `src/config.ts` (and `src/types/config.ts` if needed).
2. If it is client-exposed, add a Dockerfile `ARG`/`ENV` and update deploy workflows.
3. If it is server-only, ensure it is provided at runtime (container env/secret).

## Optional Placeholder Workflow (Not Used by Default)

`update-config.sh` and `replace-placeholders.mjs` can rewrite builds to include placeholders, but there is
no runtime replacement script wired into `docker-entrypoint.sh`. If you want runtime replacement, you must
implement a startup script that swaps placeholders in the `.next` output.

# syntax=docker/dockerfile:1
# Stage 1: Dependencies and Build
FROM node:22.12-slim AS builder

WORKDIR /app

RUN corepack enable

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy and install dependencies, caching this layer
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile --production=false

# Copy application files
COPY . .

# ---------- PUBLIC (CLIENT-SIDE) BUILD ARGS ----------
# Build id must be set at build time so client bundle and /api/version can detect stale deploys
ARG NEXT_PUBLIC_BUILD_ID=""
ARG NEXT_PUBLIC_URL="https://app.dev.socratics.ai"
ARG NEXT_PUBLIC_LOGOS_URL="https://logos.dev.socratics.ai/api/v1"
ARG NEXT_PUBLIC_GRAPHQL_URL="https://socraticsai-dev.hasura.app/v1/graphql"
ARG NEXT_PUBLIC_HASURA_WS_URL="wss://socraticsai-dev.hasura.app/v1/graphql"
ARG NEXT_PUBLIC_AUTH0_DOMAIN="https://dev-8thbtuak3ygwi46n.us.auth0.com"
ARG NEXT_PUBLIC_AUTH0_CLIENT_ID="yj2Smyl9UMaa2mAxrGblvZeSFF1U5XEF"
ARG NEXT_PUBLIC_AUTH0_REDIRECT_URI="https://app.dev.socratics.ai/api/auth/callback"
ARG NEXT_PUBLIC_AUTH0_AUDIENCE="https://socraticsai-dev.hasura.app/v1/graphql"
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID="G-WZW2HD7YN3"
ARG NEXT_PUBLIC_AMPLITUDE_API_KEY="f080defbddd57e2b7d031eb8973f87a"
# Base URL for the v2-frontend (Compose) host. Used by src/lib/composeUrl.ts
# to build cross-origin handoff URLs. Empty default → relative URLs (only
# correct if Compose is co-hosted with Agora, which is not the case today).
# Build pipeline injects the per-env value via deploy-agora.yml build-args.
ARG NEXT_PUBLIC_COMPOSE_BASE_URL=""

ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_LOGOS_URL=$NEXT_PUBLIC_LOGOS_URL
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL
ENV NEXT_PUBLIC_HASURA_WS_URL=$NEXT_PUBLIC_HASURA_WS_URL
ENV NEXT_PUBLIC_AUTH0_DOMAIN=$NEXT_PUBLIC_AUTH0_DOMAIN
ENV NEXT_PUBLIC_AUTH0_CLIENT_ID=$NEXT_PUBLIC_AUTH0_CLIENT_ID
ENV NEXT_PUBLIC_AUTH0_REDIRECT_URI=$NEXT_PUBLIC_AUTH0_REDIRECT_URI
ENV NEXT_PUBLIC_AUTH0_AUDIENCE=$NEXT_PUBLIC_AUTH0_AUDIENCE
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_AMPLITUDE_API_KEY=$NEXT_PUBLIC_AMPLITUDE_API_KEY
ENV NEXT_PUBLIC_COMPOSE_BASE_URL=$NEXT_PUBLIC_COMPOSE_BASE_URL

# ---------- AUTH0 SERVER-SIDE BUILD ARGS (FIX) ----------
ARG AUTH0_SECRET
ARG AUTH0_BASE_URL
ARG AUTH0_ISSUER_BASE_URL
ARG AUTH0_CLIENT_ID
ARG AUTH0_CLIENT_SECRET
ARG AUTH0_AUDIENCE
ARG HASURA_ADMIN_SECRET

ENV AUTH0_SECRET=$AUTH0_SECRET
ENV AUTH0_BASE_URL=$AUTH0_BASE_URL
ENV AUTH0_ISSUER_BASE_URL=$AUTH0_ISSUER_BASE_URL
ENV AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
ENV AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
ENV AUTH0_AUDIENCE=$AUTH0_AUDIENCE
ENV HASURA_ADMIN_SECRET=$HASURA_ADMIN_SECRET

# Sentry source-map upload + release tagging at build time. SENTRY_RELEASE
# (the deploy SHA) is baked into the build; SENTRY_AUTH_TOKEN is passed as a
# BuildKit secret so it never lands in image layers. Both are optional — if
# absent, the Sentry plugin skips upload and `npm run build` still succeeds.
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Build the application
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    npm run build

# ---------------- STAGE 2: PRODUCTION ----------------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

RUN echo '#!/bin/sh\necho "OK"' > /app/health.sh && chmod +x /app/health.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD ["/app/health.sh"]

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
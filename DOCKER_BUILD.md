# Docker Build Guide

This document explains how to build the Agora Docker image with custom environment variables.

## Build Process

The Docker build process uses **build-time arguments** to bake environment variables into the Next.js application during the build step. This means each build is specific to an environment (dev, staging, production).

## Build Arguments

The following build arguments can be passed to customize the build:

- `NEXT_PUBLIC_URL` - Application URL
- `NEXT_PUBLIC_LOGOS_URL` - Logos API URL
- `NEXT_PUBLIC_GRAPHQL_URL` - Hasura GraphQL endpoint
- `NEXT_PUBLIC_AUTH0_DOMAIN` - Auth0 domain
- `NEXT_PUBLIC_AUTH0_CLIENT_ID` - Auth0 client ID
- `NEXT_PUBLIC_AUTH0_REDIRECT_URI` - Auth0 callback URL
- `NEXT_PUBLIC_AUTH0_AUDIENCE` - Auth0 API audience
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics measurement ID
- `NEXT_PUBLIC_AMPLITUDE_API_KEY` - Amplitude API key

## Default Values

If no build arguments are provided, the Dockerfile uses default values for the **development environment**:

```bash
NEXT_PUBLIC_URL=https://app.dev.socratics.ai
NEXT_PUBLIC_LOGOS_URL=https://logos.dev.socratics.ai/api/v1
NEXT_PUBLIC_GRAPHQL_URL=https://socraticsai-dev.hasura.app/v1/graphql
NEXT_PUBLIC_AUTH0_DOMAIN=https://auth.dev.socratics.ai
NEXT_PUBLIC_AUTH0_CLIENT_ID=qCqdKXa2pUDbcNNMU4OlNxLHQB8Avkpr
# ... etc
```

## Building Locally

### Development Build (with defaults)

```bash
docker build -t agora:dev .
```

### Custom Environment Build

To build for a different environment, pass build arguments:

```bash
docker build \
  --build-arg NEXT_PUBLIC_URL=https://app.staging.example.com \
  --build-arg NEXT_PUBLIC_LOGOS_URL=https://logos.staging.example.com/api/v1 \
  --build-arg NEXT_PUBLIC_GRAPHQL_URL=https://graphql.staging.example.com/v1/graphql \
  --build-arg NEXT_PUBLIC_AUTH0_DOMAIN=https://auth.staging.example.com \
  --build-arg NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id \
  --build-arg NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://app.staging.example.com/api/auth/callback \
  --build-arg NEXT_PUBLIC_AUTH0_AUDIENCE=https://graphql.staging.example.com/v1/graphql \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
  --build-arg NEXT_PUBLIC_AMPLITUDE_API_KEY=your-amplitude-key \
  -t agora:staging \
  .
```

### Using an .env file

You can also create an `.env.build` file and use it for build arguments:

```bash
# .env.build
NEXT_PUBLIC_URL=https://app.staging.example.com
NEXT_PUBLIC_LOGOS_URL=https://logos.staging.example.com/api/v1
NEXT_PUBLIC_GRAPHQL_URL=https://graphql.staging.example.com/v1/graphql
NEXT_PUBLIC_AUTH0_DOMAIN=https://auth.staging.example.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://app.staging.example.com/api/auth/callback
NEXT_PUBLIC_AUTH0_AUDIENCE=https://graphql.staging.example.com/v1/graphql
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_AMPLITUDE_API_KEY=your-amplitude-key
```

Then build with:

```bash
docker build $(cat .env.build | sed 's/^/--build-arg /') -t agora:staging .
```

## Running the Container

### Development

```bash
docker run -d \
  --name agora-dev \
  -p 3000:3000 \
  agora:dev
```

### With Runtime Secrets

While the public environment variables are baked into the build, you can still pass **runtime secrets** like:

```bash
docker run -d \
  --name agora-dev \
  -p 3000:3000 \
  -e HASURA_ADMIN_SECRET=your-secret \
  -e AUTH0_CLIENT_SECRET=your-secret \
  agora:dev
```

## CI/CD Integration

### GitHub Actions

The repository includes workflows that build/push images and deploy to Azure Container Apps:

- `.github/workflows/deploy-agora.yml` - Builds on push to dev/main or manual dispatch, then deploys to Azure Container Apps.
- `.github/workflows/deploy-agora-vnet.yml` - Manual build/deploy targeting the Ergon VNet stack with a custom Logos API URL.
- `.github/workflows/run-tests.yml` and `.github/workflows/comprehensive-tests.yml` run lint/tests (no image build).

Build arguments are sourced from GitHub repository variables with `DEV_` and `PROD_` prefixes, depending on the target environment.

### Azure Container Registry

To push to Azure Container Registry:

```bash
# Login
az acr login --name socraticsprodacr

# Build and tag
docker build \
  --build-arg NEXT_PUBLIC_URL=https://app.dev.socratics.ai \
  # ... other build args ...
  -t socraticsprodacr.azurecr.io/agora:latest \
  .

# Push
docker push socraticsprodacr.azurecr.io/agora:latest
```

## Important Notes

1. **Build-time vs Runtime**: Environment variables starting with `NEXT_PUBLIC_` are baked into the JavaScript bundle at build time. They cannot be changed at runtime without rebuilding the image.

2. **Secrets**: Never pass secrets (like `HASURA_ADMIN_SECRET` or `AUTH0_CLIENT_SECRET`) as build arguments, as they can be inspected in the image layers. These should be passed at runtime via environment variables.

3. **Caching**: Docker caches build layers. If you change build arguments, Docker will rebuild from that layer onward. Ensure your environment variables are correct before building to avoid unnecessary rebuilds.

4. **Image Size**: Each environment configuration requires a separate image build. This is intentional to ensure proper isolation between environments.

## Troubleshooting

### Build fails with environment variable errors

Ensure all required build arguments are provided, even if using defaults.

### Environment variables not updating

Remember that `NEXT_PUBLIC_` variables are baked at build time. If you change them, you must rebuild the image.

### Image contains wrong URLs

Check the build arguments passed during `docker build`. Use `docker history agora:tag` to inspect build arguments used.

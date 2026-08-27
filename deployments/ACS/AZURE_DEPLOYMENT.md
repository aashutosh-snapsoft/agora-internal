# Azure Container Apps Deployment for Agora

Deploy the Agora Next.js application to Azure Container Apps.

## Files

- **`azure-container-app.bicep`** - Bicep infrastructure template
- **`azure-container-app.parameters.json`** - Configuration parameters
- **`deploy-agora.sh`** - Automated deployment script
- **`.github/workflows/deploy-acs-dev.yml`** - GitHub Actions workflow for automated deployment
- **`../../DOCKER_BUILD.md`** - Docker build guide with custom environment variables

## Deployment Methods

### Option 1: GitHub Actions (Recommended)

The easiest way to deploy is using the automated GitHub Actions workflow:

1. **Trigger Manual Deployment:**
   - Go to **Actions** tab in GitHub
   - Select **"Deploy to Azure Container Apps (Dev)"**
   - Click **"Run workflow"**
   - Optionally specify a Docker tag (leave empty to build latest)

2. **Automatic Deployment:**
   - Push to `dev` branch triggers automatic deployment
   - Builds Docker image with environment variables baked in at build-time
   - Deploys to Azure Container Apps

**How It Works:**

The workflow builds the Docker image with environment variables passed as build arguments. These `NEXT_PUBLIC_*` variables are baked into the Next.js bundle at build time, making each image environment-specific.

**Required GitHub Setup:**

All required variables and secrets are already configured with `DEV_` prefix:

**Variables:**
- `DEV_RESOURCE_GROUP`, `DEV_LOCATION`, `DEV_CONTAINER_APP_NAME`
- `DEV_ACR_SERVER`, `DEV_ACR_USERNAME`, `DEV_CONTAINER_IMAGE`
- `DEV_NEXT_PUBLIC_*` (all Next.js environment variables)

**Secrets:**
- `DEV_ACR_PASSWORD` - Azure Container Registry password
- `DEV_HASURA_ADMIN_SECRET` - Hasura admin secret
- `DEV_AUTH0_CLIENT_SECRET` - Auth0 client secret
- `AZURE_CLIENT_ID` - Azure OIDC client ID (organization secret)
- `AZURE_TENANT_ID` - Azure tenant ID (organization secret)
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID (organization secret)

### Option 2: Manual Deployment via CLI

For manual deployments using the deployment script:

**Prerequisites:**

1. **Azure CLI** installed and authenticated:
   ```bash
   az login
   az account set --subscription <your-subscription-id>
   ```

2. **Access to Azure Container Registry** (socraticsprodacr.azurecr.io)

3. **Required Environment Variables:**
   ```bash
   export ACR_PASSWORD="<acr-password>"
   export HASURA_ADMIN_SECRET="<hasura-secret>"
   export AUTH0_CLIENT_SECRET="<auth0-secret>"
   ```

**Deploy:**

```bash
cd deployments/ACS

# Deploy with defaults
./deploy-agora.sh

# Deploy with custom parameters
RESOURCE_GROUP=my-agora-rg LOCATION=westus2 ./deploy-agora.sh
```

### Option 3: Manual Docker Build

For building Docker images locally with custom environment variables:

**Prerequisites:**
- Docker installed and running
- Access to Azure Container Registry

**Build and Push:**

```bash
# Login to Azure Container Registry
az acr login --name socraticsprodacr

# Build with custom environment variables
docker build \
  --build-arg NEXT_PUBLIC_URL=https://app.dev.socratics.ai \
  --build-arg NEXT_PUBLIC_LOGOS_URL=https://logos.dev.socratics.ai/api/v1 \
  --build-arg NEXT_PUBLIC_GRAPHQL_URL=https://socraticsai-dev.hasura.app/v1/graphql \
  --build-arg NEXT_PUBLIC_AUTH0_DOMAIN=https://auth.dev.socratics.ai \
  --build-arg NEXT_PUBLIC_AUTH0_CLIENT_ID=qCqdKXa2pUDbcNNMU4OlNxLHQB8Avkpr \
  --build-arg NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://app.dev.socratics.ai/api/auth/callback \
  --build-arg NEXT_PUBLIC_AUTH0_AUDIENCE=https://socraticsai-dev.hasura.app/v1/graphql \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=G-WZW2HD7YN3 \
  --build-arg NEXT_PUBLIC_AMPLITUDE_API_KEY=f080defbddd57e2b7d031eb8973f87a \
  -t socraticsprodacr.azurecr.io/agora:custom-tag \
  .

# Push to registry
docker push socraticsprodacr.azurecr.io/agora:custom-tag
```

See [`DOCKER_BUILD.md`](../../DOCKER_BUILD.md) for detailed Docker build instructions.

## What Gets Created

The deployment creates:

- **Resource Group** (default: `agora-dev-rg`)
- **Log Analytics Workspace** - For container logs
- **Container App Environment** - Managed infrastructure
- **Container App** - Agora application with:
  - External ingress on port 3000
  - HTTPS enabled (auto TLS certificate)
  - Autoscaling: 1-3 replicas based on HTTP load
  - All dev environment variables configured

## Auto-Generated Hostname

The deployment uses the **Microsoft-generated FQDN** (not a custom domain):

```
https://agora-dev.<random-string>.<region>.azurecontainerapps.io
```

This hostname is automatically:
- Created by Azure
- SSL/TLS enabled with auto-renewed certificates
- Set in `NEXT_PUBLIC_URL` and `NEXT_PUBLIC_AUTH0_REDIRECT_URI`

## Post-Deployment Steps

### 1. Configure Auth0

After deployment, you **must** add the callback URL to Auth0:

```bash
# The script will output the FQDN
# Example: https://agora-dev.nicebeach-12345678.eastus.azurecontainerapps.io
```

**Add to Auth0 Application:**
1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to Applications → Your Application
3. Add to **Allowed Callback URLs**:
   ```
   https://agora-dev.<random-string>.<region>.azurecontainerapps.io/api/auth/callback
   ```
4. Add to **Allowed Web Origins**:
   ```
   https://agora-dev.<random-string>.<region>.azurecontainerapps.io
   ```
5. Save changes

### 2. Access Your Application

```bash
# Get the URL (output from deployment)
az containerapp show \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv

# Or use the deployment output
FQDN=$(az deployment group show \
  --name <deployment-name> \
  --resource-group agora-dev-rg \
  --query properties.outputs.containerAppUrl.value \
  --output tsv)

echo "Access at: $FQDN"
```

## Environment Configuration

### Current Setup (Development)

The parameters file contains all dev environment variables:

- **Hasura**: `https://socraticsai-dev.hasura.app/v1/graphql`
- **Logos API**: `https://logos.dev.socratics.ai/api/v1`
- **Auth0**: `auth.dev.socratics.ai`
- **Analytics**: Google Analytics, Amplitude

### Resource Sizing

**Development:**
- CPU: 2.0 cores
- Memory: 4Gi
- Replicas: 1-10 (autoscaling based on HTTP load)

## Common Operations

### View Logs

```bash
# Stream logs in real-time
az containerapp logs show \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --follow

# View recent logs
az containerapp logs show \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --tail 100
```

### Update Container Image

```bash
# Deploy new version
az containerapp update \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --image socraticsprodacr.azurecr.io/agora:v1.2.3
```

### Update Environment Variables

```bash
# Update a single environment variable
az containerapp update \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --set-env-vars "NEXT_PUBLIC_LOGOS_URL=https://new-logos-url.com"

# Update multiple variables
az containerapp update \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --set-env-vars \
    "NEXT_PUBLIC_LOGOS_URL=https://new-logos-url.com" \
    "NEXT_PUBLIC_GA_MEASUREMENT_ID=G-NEWID123"
```

### Scale Application

```bash
# Manual scaling
az containerapp update \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --min-replicas 2 \
  --max-replicas 5
```

### Get Application Status

```bash
# View container app details
az containerapp show \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --output table

# Check current revisions
az containerapp revision list \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --output table
```

## Architecture

```
Resource Group (agora-dev-rg)
├── Log Analytics Workspace
│   └── Container logs and metrics
├── Container App Environment
│   └── Managed Kubernetes infrastructure
└── Container App (agora-dev)
    ├── External Ingress (HTTPS, port 3000)
    ├── Auto TLS certificate
    ├── Container: socraticsprodacr.azurecr.io/agora:latest
    ├── Environment Variables (Next.js)
    └── Autoscaling (HTTP-based, 1-3 replicas)
```

## Networking

- **VNet**: Not configured (public deployment)
- **Ingress**: External (publicly accessible)
- **HTTPS**: Enabled with auto-managed TLS certificate
- **Port**: 3000 (internal container port)
- **FQDN**: Auto-generated by Azure

## Cost Estimate

**Development Environment:**
- 2 vCPU, 4GB RAM: ~$10-30/month (depending on usage)
- Log Analytics (1GB): ~$2/month
- **Total: ~$12-32/month**

Note: Costs scale with actual usage. With autoscaling (1-10 replicas), costs increase only when traffic increases. Enable scale-to-zero for even lower costs during idle times.

## Troubleshooting

### Container Fails to Start

```bash
# Check logs for errors
az containerapp logs show \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --tail 50

# Check revision status
az containerapp revision list \
  --name agora-dev \
  --resource-group agora-dev-rg
```

### Auth0 Login Not Working

1. Verify callback URL is added to Auth0
2. Check FQDN matches in environment variables:
   ```bash
   az containerapp show \
     --name agora-dev \
     --resource-group agora-dev-rg \
     --query properties.template.containers[0].env
   ```

### Can't Access Application

```bash
# Verify ingress is enabled and external
az containerapp show \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --query properties.configuration.ingress
```

### Update FQDN in Environment Variables

If you need to manually update the URLs:

```bash
# Get current FQDN
FQDN=$(az containerapp show \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

# Update environment variables
az containerapp update \
  --name agora-dev \
  --resource-group agora-dev-rg \
  --set-env-vars \
    "NEXT_PUBLIC_URL=https://$FQDN" \
    "NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://$FQDN/api/auth/callback"
```

## Cleanup

To delete all resources:

```bash
# Delete resource group (removes everything)
az group delete --name agora-dev-rg --yes --no-wait
```

## Multi-Environment Deployments

Create separate parameter files for each environment:

```bash
# Create staging parameters
cp azure-container-app.parameters.json azure-container-app.parameters.staging.json
# Edit staging parameters...

# Deploy to staging
RESOURCE_GROUP=agora-staging-rg \
CONTAINER_APP_NAME=agora-staging \
./deploy-azure-container-app.sh
```

## CI/CD Integration

### GitHub Actions Workflow

The repository includes a complete GitHub Actions workflow at `.github/workflows/deploy-acs-dev.yml` that:

1. **Builds and pushes Docker images** to Azure Container Registry
2. **Deploys to Azure Container Apps** using Bicep template
3. **Sends notifications** via webhook on success/failure
4. **Supports manual deployments** with custom Docker tags

**Workflow Features:**
- Automatic deployment on push to `dev` branch
- Manual deployment trigger with optional Docker tag
- Uses GitHub variables and secrets (DEV_ prefix)
- Parallel build and deploy jobs
- Deployment status notifications

**To use the workflow:**
```bash
# Automatic: Just push to dev branch
git push origin dev

# Manual: Use GitHub UI
# 1. Go to Actions tab
# 2. Select "Deploy to Azure Container Apps (Dev)"
# 3. Click "Run workflow"
# 4. (Optional) Enter a Docker tag to deploy specific version
```

## Support

- **Azure Container Apps Docs**: https://learn.microsoft.com/azure/container-apps/
- **Bicep Reference**: https://learn.microsoft.com/azure/templates/
- **Azure CLI Reference**: https://learn.microsoft.com/cli/azure/containerapp

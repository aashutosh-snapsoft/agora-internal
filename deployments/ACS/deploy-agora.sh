#!/bin/bash

# Deploy Agora to Azure Container Apps using Bicep
# Prerequisites: az cli installed and logged in (az login)
# All parameters can be set via environment variables for GitHub Actions deployment

set -e

# Configuration - can be overridden by environment variables
RESOURCE_GROUP="${RESOURCE_GROUP:-logos-dev-rg}"
LOCATION="${LOCATION:-westus2}"
CONTAINER_APP_NAME="${CONTAINER_APP_NAME:-agora-dev}"
CONTAINER_APP_ENV_NAME="${CONTAINER_APP_ENV_NAME:-agora-environment}"
ENVIRONMENT="${ENVIRONMENT:-development}"
DEPLOYMENT_NAME="agora-deployment-$(date +%Y%m%d-%H%M%S)"

# Container configuration
CONTAINER_IMAGE="${CONTAINER_IMAGE:-socraticsprodacr.azurecr.io/agora:latest}"
ACR_SERVER="${ACR_SERVER:-socraticsprodacr.azurecr.io}"
ACR_USERNAME="${ACR_USERNAME:-socraticsprodacr}"
ACR_PASSWORD="${ACR_PASSWORD:-}"
CPU="${CPU:-2.0}"
MEMORY="${MEMORY:-4Gi}"
MIN_REPLICAS="${MIN_REPLICAS:-1}"
MAX_REPLICAS="${MAX_REPLICAS:-10}"
ENABLE_WORKLOAD_PROFILES="${ENABLE_WORKLOAD_PROFILES:-false}"
CUSTOM_HOSTNAME="${CUSTOM_HOSTNAME:-app.dev.socratics.ai}"
MANAGED_CERTIFICATE_NAME="${MANAGED_CERTIFICATE_NAME:-mc-agora-environm-app-dev-socratic-1339}"

# Secrets (must be provided via environment variables)
HASURA_ADMIN_SECRET="${HASURA_ADMIN_SECRET:-}"
AUTH0_CLIENT_SECRET="${AUTH0_CLIENT_SECRET:-}"
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:-}"

# Application URLs - will be set to FQDN after deployment if not provided
APP_URL="${APP_URL:-}"
LOGOS_URL="${LOGOS_URL:-https://logos.dev.socratics.ai/api/v1}"
GRAPHQL_URL="${GRAPHQL_URL:-https://socraticsai-dev.hasura.app/v1/graphql}"

# Auth0 configuration
AUTH0_DOMAIN="${AUTH0_DOMAIN:-https://auth.dev.socratics.ai}"
AUTH0_CLIENT_ID="${AUTH0_CLIENT_ID:-qCqdKXa2pUDbcNNMU4OlNxLHQB8Avkpr}"
AUTH0_REDIRECT_URI="${AUTH0_REDIRECT_URI:-}"
AUTH0_AUDIENCE="${AUTH0_AUDIENCE:-https://socraticsai-dev.hasura.app/v1/graphql}"

# Analytics configuration
GA_MEASUREMENT_ID="${GA_MEASUREMENT_ID:-G-WZW2HD7YN3}"
AMPLITUDE_API_KEY="${AMPLITUDE_API_KEY:-f080defbddd57e2b7d031eb8973f87a}"

# Paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "================================"
echo "Azure Container Apps Deployment"
echo "================================"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Environment: $ENVIRONMENT"
echo "Container App: $CONTAINER_APP_NAME"
echo "Container Image: $CONTAINER_IMAGE"
echo "Deployment Name: $DEPLOYMENT_NAME"
echo "================================"
echo ""

# Create resource group if it doesn't exist
echo "Creating resource group..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"

echo ""
echo "Deploying Bicep template..."

# Validate required secrets
if [ -z "$ACR_PASSWORD" ] || [ -z "$HASURA_ADMIN_SECRET" ] || [ -z "$AUTH0_CLIENT_SECRET" ] || [ -z "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" ]; then
    echo "Error: Required secrets are missing. Please set:"
    [ -z "$ACR_PASSWORD" ] && echo "  - ACR_PASSWORD"
    [ -z "$HASURA_ADMIN_SECRET" ] && echo "  - HASURA_ADMIN_SECRET"
    [ -z "$AUTH0_CLIENT_SECRET" ] && echo "  - AUTH0_CLIENT_SECRET"
    [ -z "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" ] && echo "  - NEXT_SERVER_ACTIONS_ENCRYPTION_KEY (generate with: openssl rand -base64 32)"
    exit 1
fi

az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DEPLOYMENT_NAME" \
  --template-file "$SCRIPT_DIR/azure-container-app.bicep" \
  --parameters \
    containerAppName="$CONTAINER_APP_NAME" \
    location="$LOCATION" \
    environment="$ENVIRONMENT" \
    containerAppEnvironmentName="$CONTAINER_APP_ENV_NAME" \
    containerImage="$CONTAINER_IMAGE" \
    acrServer="$ACR_SERVER" \
    acrUsername="$ACR_USERNAME" \
    acrPassword="$ACR_PASSWORD" \
    hasuraAdminSecret="$HASURA_ADMIN_SECRET" \
    auth0ClientSecret="$AUTH0_CLIENT_SECRET" \
    nextServerActionsEncryptionKey="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" \
    cpu="$CPU" \
    memory="$MEMORY" \
    minReplicas="$MIN_REPLICAS" \
    maxReplicas="$MAX_REPLICAS" \
    enableWorkloadProfiles="$ENABLE_WORKLOAD_PROFILES" \
    customHostname="$CUSTOM_HOSTNAME" \
    managedCertificateName="$MANAGED_CERTIFICATE_NAME" \
    appUrl="placeholder" \
    logosUrl="$LOGOS_URL" \
    graphqlUrl="$GRAPHQL_URL" \
    auth0Domain="$AUTH0_DOMAIN" \
    auth0ClientId="$AUTH0_CLIENT_ID" \
    auth0RedirectUri="placeholder" \
    auth0Audience="$AUTH0_AUDIENCE" \
    gaMeasurementId="$GA_MEASUREMENT_ID" \
    amplitudeApiKey="$AMPLITUDE_API_KEY"

# Get the FQDN from deployment outputs
echo ""
echo "Getting Container App FQDN..."
FQDN=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.outputs.containerAppFQDN.value \
  --output tsv)

if [ -z "$FQDN" ]; then
    echo "Error: Could not get FQDN from deployment"
    exit 1
fi

echo "FQDN: $FQDN"

# Update environment variables with the actual FQDN
echo ""
echo "Updating environment variables with FQDN..."
az containerapp update \
  --name "$CONTAINER_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --set-env-vars \
    "NEXT_PUBLIC_URL=https://$FQDN" \
    "NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://$FQDN/api/auth/callback"

echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
echo "Container App URL: https://$FQDN"
echo "Auth Callback URL: https://$FQDN/api/auth/callback"
echo ""
echo "⚠️  IMPORTANT: Add this callback URL to Auth0:"
echo "   1. Go to Auth0 Dashboard → Applications → Your App"
echo "   2. Add 'https://$FQDN/api/auth/callback' to 'Allowed Callback URLs'"
echo "   3. Add 'https://$FQDN' to 'Allowed Web Origins'"
echo ""
echo "To view logs:"
echo "  az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo ""
echo "To update the app:"
echo "  az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --image socraticsprodacr.azurecr.io/agora:<tag>"
echo "================================"

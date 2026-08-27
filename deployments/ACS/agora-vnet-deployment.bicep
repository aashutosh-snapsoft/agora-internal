// Agora Container App deployment into Infrastructure VNet
// This deployment references the Container Apps Environment created by the infrastructure repo
// and deploys Agora (Next.js frontend) connecting to Logos backend
//
// Prerequisites:
// 1. Infrastructure repo must have deployed the VNet and Container Apps Environment
// 2. The Container Apps Environment ID must be provided as a parameter
// 3. Logos must be deployed and accessible within the VNet
//
// Deploy with:
// az deployment group create \
//   --resource-group <rg-name> \
//   --template-file agora-vnet-deployment.bicep \
//   --parameters containerAppsEnvironmentId=<env-id>

targetScope = 'resourceGroup'

// ============================================
// Core Parameters
// ============================================

@description('Name of the Container App')
param containerAppName string = 'agora-ergon-dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment name')
@allowed(['dev', 'prod'])
param environment string = 'dev'

@description('Container Apps Environment ID from infrastructure deployment')
param containerAppsEnvironmentId string

@description('Container image and tag')
param containerImage string = 'socraticsprodacr.azurecr.io/agora:latest'

@description('ACR server')
param acrServer string = 'socraticsprodacr.azurecr.io'

@description('ACR username')
@secure()
param acrUsername string

@description('ACR password')
@secure()
param acrPassword string

// ============================================
// Resource Sizing
// ============================================

@description('CPU cores allocated to the container')
param cpu string = '1.0'

@description('Memory allocated to the container')
param memory string = '2Gi'

@description('Minimum number of replicas')
param minReplicas int = 1

@description('Maximum number of replicas')
param maxReplicas int = 5

@description('Workload profile name (use Consumption for dev, dedicated profile for prod)')
param workloadProfileName string = 'Consumption'

// ============================================
// Networking & Domain
// ============================================

@description('Custom domain name for the container app')
param customDomain string = ''

@description('Managed certificate name for custom domain (leave empty if no custom domain)')
param managedCertificateName string = ''

// ============================================
// Logos Backend Connection
// ============================================

@description('Logos API URL for backend services (internal VNet address)')
param logosApiUrl string = 'https://logos-ergon-dev.internal.westus2.azurecontainerapps.io/api/v1'

// ============================================
// Application Secrets
// ============================================

@secure()
@description('Hasura admin secret')
param hasuraAdminSecret string

@secure()
@description('Auth0 client secret')
param auth0ClientSecret string

@secure()
@description('Auth0 session encryption secret')
param auth0Secret string

@secure()
@description('Next.js server actions encryption key')
param nextServerActionsEncryptionKey string

@secure()
@description('Sentry DSN for error tracking (optional)')
param sentryDsn string = ''

// ============================================
// Application Configuration
// ============================================

@description('Application URL')
param appUrl string

@description('Hasura GraphQL endpoint')
param graphqlUrl string

@description('Hasura WebSocket URL for subscriptions')
param hasuraWsUrl string = ''

@description('Auth0 domain')
param auth0Domain string

@description('Auth0 client ID')
param auth0ClientId string

@description('Auth0 redirect URI')
param auth0RedirectUri string

@description('Auth0 API audience')
param auth0Audience string

@description('Auth0 base URL (app URL)')
param auth0BaseUrl string

@description('Auth0 issuer base URL (Auth0 tenant URL)')
param auth0IssuerBaseUrl string

@description('Google Analytics measurement ID')
param gaMeasurementId string = ''

@description('Amplitude API key')
param amplitudeApiKey string = ''

// ─── CosmosDB ──────────────────────────────────────────────────────────────
// Required so the project-directory and document-create BFF routes can read
// from the canonical Cosmos doc (Hasura is being removed; Cosmos is the
// single source of truth for projects). Endpoint comes from App Config
// (data/{env}/cosmosEndpoint); the key is fetched at deploy time via
// `az cosmosdb keys list` and passed through as a @secure param. The
// account is provisioned in the infrastructure repo (not agora's concern).
//
// Database + container names default to the v2-frontend convention so
// agora and v2-frontend share the same Cosmos namespace.
@description('CosmosDB account endpoint URL (from App Config: data/{env}/cosmosEndpoint).')
param cosmosEndpoint string

@description('CosmosDB primary key (fetched at deploy time via az cosmosdb keys list).')
@secure()
param cosmosKey string

@description('CosmosDB database name. Matches v2-frontend convention.')
param cosmosDatabase string = 'socratics-documents'

@description('CosmosDB container for financial model documents.')
param cosmosContainerDocuments string = 'financial_models'

// ============================================
// Project storage (promoted from the former demo-staging surface — SCS-110/PR #569)
// ============================================
// demoStagingEnabled / demoRouteToken / demoWsPsk are gone with the surface they
// gated (the hidden /demo/<token> route + its WebSocket transport, both removed).
// azureStorageAccount stays — /api/projects/* now needs it in every environment,
// not just dev.

@description('Storage account backing /api/projects/* container creation. Required in every environment now (not dev-only) — see PR #569 review.')
param azureStorageAccount string = ''

// ============================================
// Tags
// ============================================

@description('Tags for all resources')
param tags object = {
  environment: environment
  project: 'agora'
  managedBy: 'bicep'
  integration: 'ergon-stack'
}

// ============================================
// Resources
// ============================================

// Extract environment name from the provided ID for reference
var containerAppsEnvironmentName = last(split(containerAppsEnvironmentId, '/'))

// Reference the Container Apps Environment from infrastructure
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerAppsEnvironmentName
}

// Create Container App with managed identity
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    workloadProfileName: workloadProfileName
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: true // App Gateway connects via HTTP
        stickySessions: {
          affinity: 'sticky'
        }
        customDomains: customDomain != '' ? [
          {
            name: customDomain
            bindingType: 'Disabled' // TLS handled by App Gateway
          }
        ] : []
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      registries: [
        {
          server: acrServer
          username: acrUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: concat([
        { name: 'acr-password', value: acrPassword }
        { name: 'hasura-admin-secret', value: hasuraAdminSecret }
        { name: 'auth0-client-secret', value: auth0ClientSecret }
        { name: 'auth0-secret', value: auth0Secret }
        { name: 'next-server-actions-key', value: nextServerActionsEncryptionKey }
        { name: 'cosmos-key', value: cosmosKey }
      ], sentryDsn != '' ? [
        { name: 'sentry-dsn', value: sentryDsn }
      ] : [])
    }
    template: {
      containers: [
        {
          name: 'agora'
          image: containerImage
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: concat([
            // Secrets
            { name: 'HASURA_ADMIN_SECRET', secretRef: 'hasura-admin-secret' }
            { name: 'AUTH0_CLIENT_SECRET', secretRef: 'auth0-client-secret' }
            { name: 'AUTH0_SECRET', secretRef: 'auth0-secret' }
            { name: 'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY', secretRef: 'next-server-actions-key' }

            // Auth0 server-side configuration
            { name: 'AUTH0_BASE_URL', value: auth0BaseUrl }
            { name: 'AUTH0_ISSUER_BASE_URL', value: auth0IssuerBaseUrl }
            { name: 'AUTH0_CLIENT_ID', value: auth0ClientId }
            { name: 'AUTH0_AUDIENCE', value: auth0Audience }

            // Application Configuration (NEXT_PUBLIC_ vars are baked at build time)
            // These are runtime overrides for server-side usage
            { name: 'NEXT_PUBLIC_URL', value: appUrl }
            { name: 'NEXT_PUBLIC_LOGOS_URL', value: logosApiUrl }
            { name: 'NEXT_PUBLIC_GRAPHQL_URL', value: graphqlUrl }
            { name: 'NEXT_PUBLIC_HASURA_WS_URL', value: hasuraWsUrl }
            { name: 'NEXT_PUBLIC_AUTH0_DOMAIN', value: auth0Domain }
            { name: 'NEXT_PUBLIC_AUTH0_CLIENT_ID', value: auth0ClientId }
            { name: 'NEXT_PUBLIC_AUTH0_REDIRECT_URI', value: auth0RedirectUri }
            { name: 'NEXT_PUBLIC_AUTH0_AUDIENCE', value: auth0Audience }
            { name: 'NEXT_PUBLIC_GA_MEASUREMENT_ID', value: gaMeasurementId }
            { name: 'NEXT_PUBLIC_AMPLITUDE_API_KEY', value: amplitudeApiKey }

            // Server-side only (API routes need non-prefixed vars)
            { name: 'LOGOS_API_URL', value: logosApiUrl }
            { name: 'HASURA_GRAPHQL_URL', value: graphqlUrl }

            // CosmosDB — server-side reads from the canonical project doc.
            // Endpoint + database/container names are non-secret config;
            // the key is referenced via a Container App secret so its value
            // never appears in `az containerapp show` env output.
            { name: 'COSMOS_ENDPOINT', value: cosmosEndpoint }
            { name: 'COSMOS_KEY', secretRef: 'cosmos-key' }
            { name: 'COSMOS_DATABASE', value: cosmosDatabase }
            { name: 'COSMOS_CONTAINER_DOCUMENTS', value: cosmosContainerDocuments }

            // Project storage — /api/projects/* (promoted from the former
            // demo-staging surface; needed in every env now, not just dev).
            { name: 'AZURE_STORAGE_ACCOUNT', value: azureStorageAccount }

            // Environment
            { name: 'ENVIRONMENT', value: environment }
            { name: 'NODE_ENV', value: 'production' }
          ], sentryDsn != '' ? [
            { name: 'SENTRY_DSN', secretRef: 'sentry-dsn' }
          ] : [])
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// Create managed certificate for custom domain
resource managedCertificate 'Microsoft.App/managedEnvironments/managedCertificates@2023-05-01' = if (customDomain != '' && managedCertificateName != '') {
  name: managedCertificateName
  location: location
  parent: containerAppEnvironment
  dependsOn: [containerApp]
  properties: {
    subjectName: customDomain
    domainControlValidation: environment == 'dev' ? 'CNAME' : 'TXT'
  }
}

// ============================================
// Outputs
// ============================================

output containerAppId string = containerApp.id
output containerAppName string = containerApp.name
output containerAppFQDN string = containerApp.properties.configuration.ingress.fqdn
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output managedIdentityPrincipalId string = containerApp.identity.principalId
output logosApiUrl string = logosApiUrl

output summary object = {
  containerApp: {
    id: containerApp.id
    name: containerApp.name
    fqdn: containerApp.properties.configuration.ingress.fqdn
    url: 'https://${containerApp.properties.configuration.ingress.fqdn}'
  }
  environment: {
    id: containerAppsEnvironmentId
    name: containerAppsEnvironmentName
  }
  backendConnection: {
    logosApiUrl: logosApiUrl
    frontendUrl: 'https://${containerApp.properties.configuration.ingress.fqdn}'
  }
}

// Azure Container Apps deployment for Agora service with Key Vault integration
// Deploy with: az deployment group create --resource-group <rg-name> --template-file azure-container-app.bicep --parameters @azure-container-app.parameters.json

@description('Name of the Container App')
param containerAppName string = 'agora-dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment name for the Container App')
param environment string = 'development'

@description('Container App Environment name')
param containerAppEnvironmentName string = 'agora-environment'

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

@description('Hasura admin secret')
@secure()
param hasuraAdminSecret string

@description('Auth0 client secret')
@secure()
param auth0ClientSecret string

@description('Auth0 session secret')
@secure()
param auth0Secret string

@description('Auth0 base URL')
param auth0BaseUrl string

@description('Auth0 issuer base URL')
param auth0IssuerBaseUrl string

@description('Next.js server actions encryption key (32-byte base64 encoded key for stable action IDs across deployments)')
@secure()
param nextServerActionsEncryptionKey string

@description('CPU cores allocated to the container')
param cpu string = '2.0'

@description('Memory allocated to the container')
param memory string = '4Gi'

@description('Minimum number of replicas')
param minReplicas int = 1

@description('Maximum number of replicas')
param maxReplicas int = 10

@description('Custom hostname for the container app')
param customHostname string = 'app.dev.socratics.ai'

@description('Managed certificate name for custom hostname')
param managedCertificateName string = 'mc-agora-environm-app-dev-socratic-1339'

@description('Indicates whether the target environment has workload profiles enabled (true for environments with workload profiles, false for legacy Consumption Only environments)')
param enableWorkloadProfiles bool = false

// Non-sensitive parameters
param appUrl string
param logosUrl string = 'https://logos.dev.socratics.ai/api/v1'
param graphqlUrl string = 'https://socraticsai-dev.hasura.app/v1/graphql'
param hasuraWsUrl string = 'wss://socraticsai-dev.hasura.app/v1/graphql'
param hasuraGraphqlUrl string = 'https://socraticsai-dev.hasura.app/v1/graphql'
param auth0Domain string = 'https://auth.dev.socratics.ai'
param auth0ClientId string = 'qCqdKXa2pUDbcNNMU4OlNxLHQB8Avkpr'
param auth0RedirectUri string
param auth0Audience string = 'https://socraticsai-dev.hasura.app/v1/graphql'
param gaMeasurementId string = 'G-WZW2HD7YN3'
param amplitudeApiKey string = 'f080defbddd57e2b7d031eb8973f87a'
@description('Build/deploy identifier for version check; should match NEXT_PUBLIC_BUILD_ID used at image build time')
param buildId string = ''

// Project storage (promoted from the former demo-staging surface — SCS-110/PR #569)
@description('Storage account backing /api/projects/* container creation. Required in every environment now (not dev-only) — see PR #569 review.')
param azureStorageAccount string = ''

// Create Log Analytics Workspace for Container App Environment
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${containerAppName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Create Container App Environment
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvironmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Create Container App first (with Auto binding - no certificate reference needed)
resource containerApp 'Microsoft.App/containerApps@2025-07-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    workloadProfileName: enableWorkloadProfiles ? 'Consumption' : null
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'  // Force HTTP/1.1 to avoid HTTP/2 half-open stream issues with Envoy
        allowInsecure: false
        stickySessions: {
          affinity: 'sticky'
        }
        customDomains: !empty(customHostname) ? [
          {
            name: customHostname
            bindingType: 'Auto'
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
      secrets: [
        {
          name: 'acr-password'
          value: acrPassword
        }
        {
          name: 'hasura-admin-secret'
          value: hasuraAdminSecret
        }
        {
          name: 'auth0-client-secret'
          value: auth0ClientSecret
        }
        {
          name: 'auth0-secret'
          value: auth0Secret
        }
        {
          name: 'auth0-base-url'
          value: auth0BaseUrl
        }
        {
          name: 'auth0-issuer-base-url'
          value: auth0IssuerBaseUrl
        }
        {
          name: 'next-server-actions-encryption-key'
          value: nextServerActionsEncryptionKey
        }
      ]
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
          env: [
            {
              name: 'HASURA_ADMIN_SECRET'
              secretRef: 'hasura-admin-secret'
            }
            {
              name: 'HASURA_GRAPHQL_URL'
              value: hasuraGraphqlUrl
            }
            {
              name: 'AUTH0_CLIENT_SECRET'
              secretRef: 'auth0-client-secret'
            }
            {
              name: 'AUTH0_SECRET'
              secretRef: 'auth0-secret'
            }
            {
              name: 'AUTH0_BASE_URL'
              secretRef: 'auth0-base-url'
            }
            {
              name: 'AUTH0_ISSUER_BASE_URL'
              secretRef: 'auth0-issuer-base-url'
            }
            {
              name: 'NEXT_PUBLIC_URL'
              value: appUrl
            }
            {
              name: 'NEXT_PUBLIC_LOGOS_URL'
              value: logosUrl
            }
            {
              name: 'NEXT_PUBLIC_GRAPHQL_URL'
              value: graphqlUrl
            }
            {
              name: 'NEXT_PUBLIC_HASURA_WS_URL'
              value: hasuraWsUrl
            }
            {
              name: 'NEXT_PUBLIC_AUTH0_DOMAIN'
              value: auth0Domain
            }
            {
              name: 'NEXT_PUBLIC_AUTH0_CLIENT_ID'
              value: auth0ClientId
            }
            {
              name: 'NEXT_PUBLIC_AUTH0_REDIRECT_URI'
              value: auth0RedirectUri
            }
            {
              name: 'NEXT_PUBLIC_AUTH0_AUDIENCE'
              value: auth0Audience
            }
            {
              name: 'NEXT_PUBLIC_GA_MEASUREMENT_ID'
              value: gaMeasurementId
            }
            {
              name: 'NEXT_PUBLIC_AMPLITUDE_API_KEY'
              value: amplitudeApiKey
            }
            {
              name: 'BUILD_ID'
              value: buildId
            }
            {
              name: 'LOGOS_API_URL'
              value: logosUrl
            }
            {
              name: 'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY'
              secretRef: 'next-server-actions-encryption-key'
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT'
              value: azureStorageAccount
            }
          ]
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
  tags: {
    Environment: environment
    Service: 'agora'
    ManagedBy: 'bicep'
  }
}

// Create managed certificate after container app - Auto binding will attach it when validated
// Dev uses CNAME validation, Prod uses TXT validation
resource managedCertificate 'Microsoft.App/managedEnvironments/managedCertificates@2025-07-01' = if (!empty(customHostname)) {
  name: managedCertificateName
  location: location
  parent: containerAppEnvironment
  dependsOn: [containerApp]
  properties: {
    subjectName: customHostname
    domainControlValidation: 'CNAME'
  }
}

output containerAppFQDN string = containerApp.properties.configuration.ingress.fqdn
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output resourceGroupName string = resourceGroup().name
output containerAppName string = containerApp.name

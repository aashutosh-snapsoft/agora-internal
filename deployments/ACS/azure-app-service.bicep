// Azure App Service deployment for Agora
// Replaces Container Apps to avoid Envoy ingress issues

@description('Name of the App Service')
param appServiceName string = 'agora-prod'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment (development, staging, production)')
param environment string = 'production'

@description('Container image to deploy')
param containerImage string

@description('Azure Container Registry server')
param acrServer string

@description('Azure Container Registry username')
param acrUsername string

@description('Azure Container Registry password')
@secure()
param acrPassword string

@description('Hasura admin secret')
@secure()
param hasuraAdminSecret string

@description('Auth0 client secret')
@secure()
param auth0ClientSecret string

@description('Next.js server actions encryption key')
@secure()
param nextServerActionsEncryptionKey string

@description('App Service Plan SKU')
param skuName string = 'P1v3'

@description('Custom hostname for the app (optional - leave empty if using Front Door)')
param customHostname string = ''

@description('Whether to configure custom domain directly on App Service')
param enableCustomDomain bool = false

// Application configuration
@description('Public URL of the application')
param appUrl string

@description('Logos API URL')
param logosUrl string

@description('GraphQL endpoint URL')
param graphqlUrl string

@description('Hasura WebSocket URL for subscriptions')
param hasuraWsUrl string = ''

@description('Auth0 domain')
param auth0Domain string

@description('Auth0 client ID')
param auth0ClientId string

@description('Auth0 redirect URI')
param auth0RedirectUri string

@description('Auth0 audience')
param auth0Audience string

@description('Google Analytics measurement ID')
param gaMeasurementId string = ''

@description('Amplitude API key')
param amplitudeApiKey string = ''

@description('Build/deploy identifier for version check; should match NEXT_PUBLIC_BUILD_ID used at image build time')
param buildId string = ''

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appServiceName}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: skuName
  }
  properties: {
    reserved: true // Required for Linux
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceName
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      alwaysOn: true
      http20Enabled: false // Force HTTP/1.1
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://${acrServer}'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_USERNAME'
          value: acrUsername
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_PASSWORD'
          value: acrPassword
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'WEBSITES_PORT'
          value: '3000'
        }
        {
          name: 'NODE_ENV'
          value: environment
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
          name: 'HASURA_ADMIN_SECRET'
          value: hasuraAdminSecret
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
          name: 'AUTH0_CLIENT_SECRET'
          value: auth0ClientSecret
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
          name: 'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY'
          value: nextServerActionsEncryptionKey
        }
      ]
    }
  }
}

// Custom domain binding (optional - only if not using Front Door)
resource customDomainBinding 'Microsoft.Web/sites/hostNameBindings@2022-09-01' = if (enableCustomDomain && customHostname != '') {
  parent: appService
  name: customHostname
  properties: {
    siteName: appServiceName
    hostNameType: 'Verified'
    sslState: 'Disabled' // Will enable after managed cert is created
  }
}

// Managed certificate for custom domain (optional)
resource managedCertificate 'Microsoft.Web/certificates@2022-09-01' = if (enableCustomDomain && customHostname != '') {
  name: '${appServiceName}-cert'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    canonicalName: customHostname
  }
  dependsOn: [
    customDomainBinding
  ]
}

// Enable SSL for custom domain after certificate is created (optional)
resource customDomainSsl 'Microsoft.Web/sites/hostNameBindings@2022-09-01' = if (enableCustomDomain && customHostname != '') {
  parent: appService
  name: customHostname
  properties: {
    siteName: appServiceName
    hostNameType: 'Verified'
    sslState: 'SniEnabled'
    thumbprint: managedCertificate.properties.thumbprint
  }
  dependsOn: [
    managedCertificate
  ]
}

output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServiceDefaultHostName string = appService.properties.defaultHostName
output customDomainUrl string = enableCustomDomain ? 'https://${customHostname}' : ''
output appServiceName string = appService.name

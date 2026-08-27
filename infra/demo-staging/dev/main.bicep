// ---------------------------------------------------------------------------
// Demo-staging — DEV resource provisioning (resource-group scoped).
//
// THIS TEMPLATE IS DEV-ONLY. It PROVISIONS the resources the demo-staging
// feature needs in a throwaway dev resource group, then composes the existing
// ../rbac.bicep module to grant the keyless RBAC on what it just created.
//
// What it creates:
//   1. One Storage account (Standard, StorageV2) carrying the Blob + Table
//      services the demo uses. Shared-key access is DISABLED
//      (allowSharedKeyAccess: false) so the only way in is Azure AD identity —
//      which is exactly the keyless contract (contracts/keyless-auth-contract.md).
//      The demoProjects table is created up front so the ownership registry has
//      somewhere to write on first use.
//   2. Two user-assigned managed identities — one for Agora, one for the box
//      runner. The operator assigns these to the dev Agora container app and to
//      the runner host respectively; DefaultAzureCredential then resolves them
//      with no key in the container.
//   3. The keyless RBAC role assignments, by REUSING ../rbac.bicep as a module
//      (no duplication of the role-assignment logic):
//        Agora identity   -> Storage Blob Data Contributor
//                         -> Storage Blob Delegator           (mint the user-delegation key)
//                         -> Storage Table Data Contributor   (demoProjects ownership registry)
//        runner identity  -> Storage Blob Data Contributor    (read inputs, write results)
//
// Outputs: the account name + both identities' client/object ids, which the
// operator needs to wire DefaultAzureCredential and to assign the MIs.
//
// Deploy against a dev RG with:
//   az deployment group create \
//     --resource-group <dev-rg> \
//     --template-file infra/demo-staging/dev/main.bicep \
//     --parameters infra/demo-staging/dev/main.dev.bicepparam
// (or pass --parameters namePrefix=... location=... inline)
// ---------------------------------------------------------------------------

targetScope = 'resourceGroup'

@description('Short dev naming prefix (lowercase letters/numbers, 3-11 chars). Used to derive the storage account name and the identity names. Keep it short — the storage account name is prefix + a uniqueString suffix and must stay <= 24 chars.')
@minLength(3)
@maxLength(11)
param namePrefix string = 'agorademo'

@description('Azure region for all dev resources. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Principal type for the role assignments. ServicePrincipal is correct for user-assigned managed identities.')
@allowed([
  'ServicePrincipal'
  'User'
  'Group'
])
param principalType string = 'ServicePrincipal'

@description('Storage SKU for the dev account. Standard_LRS is the cheap dev default.')
@allowed([
  'Standard_LRS'
  'Standard_ZRS'
  'Standard_GRS'
])
param storageSku string = 'Standard_LRS'

@description('Agora dev origin(s) allowed to make browser-side calls to the Blob service (CORS preflight + list/upload/download against the user-delegation SAS). Exact scheme+host, e.g. https://<agora-dev-host>. NO wildcard "*" — the SAS is the capability; CORS is defense-in-depth on WHICH page may call. Operator-supplied per dev environment (see main.dev.bicepparam / --parameters); no real-origin default is baked into the template.')
param allowedCorsOrigins array

// Storage account names are global, lowercase, 3-24 chars, alphanumeric only.
// Derive a stable-per-RG name from the prefix + a short uniqueString suffix.
var storageAccountName = toLower('${namePrefix}${uniqueString(resourceGroup().id)}')
var agoraIdentityName = '${namePrefix}-agora-mi'
var runnerIdentityName = '${namePrefix}-runner-mi'

// The ownership registry's table name is frozen in the contract (demoProjects).
var ownershipTableName = 'demoProjects'

// --- Storage account: keyless (no shared key), Blob + Table services ---
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: storageSku
  }
  kind: 'StorageV2'
  properties: {
    // Keyless contract: the account key path is closed entirely. Only Azure AD
    // identity (DefaultAzureCredential) can authenticate — there is no shared
    // key to leak, and getUserDelegationKey() (used to sign the SAS) still works
    // because it is an Azure AD operation, not a shared-key one.
    allowSharedKeyAccess: false
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    accessTier: 'Hot'
  }
}

// Blob service (the per-demo containers live here).
// CORS: allow the operator-supplied Agora dev origin(s) so the browser-side
// @azure/storage-blob SDK can list/upload/download against the user-delegation
// SAS (incl. the OPTIONS preflight). This governs browser preflight only — it is
// NOT authentication and does NOT touch the keyless posture above.
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: allowedCorsOrigins
          allowedMethods: [
            'GET'
            'PUT'
            'OPTIONS'
            'HEAD'
          ]
          allowedHeaders: [
            '*'
          ]
          exposedHeaders: [
            '*'
          ]
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

// Table service + the demoProjects ownership-registry table.
resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource ownershipTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  parent: tableService
  name: ownershipTableName
}

// --- User-assigned managed identities (operator assigns these to the hosts) ---
resource agoraIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: agoraIdentityName
  location: location
}

resource runnerIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: runnerIdentityName
  location: location
}

// --- Keyless RBAC — REUSE ../rbac.bicep (compose, do not duplicate) ---
// rbac.bicep grants exactly the four role assignments the keyless plane needs,
// scoped to an existing storage account. Here the account is the one we just
// created, and the principals are the object ids of the two MIs above.
module rbac '../rbac.bicep' = {
  name: 'demo-staging-dev-rbac'
  params: {
    storageAccountName: storageAccount.name
    agoraPrincipalId: agoraIdentity.properties.principalId
    runnerPrincipalId: runnerIdentity.properties.principalId
    principalType: principalType
  }
}

// --- Outputs the operator needs ---
@description('Storage account NAME — the value Agora and the runner read as AZURE_STORAGE_ACCOUNT.')
output storageAccountName string = storageAccount.name

@description('The ownership-registry table name (frozen by contract: demoProjects).')
output ownershipTableName string = ownershipTableName

@description('Agora user-assigned MI resource id — assign this to the dev Agora container app.')
output agoraIdentityResourceId string = agoraIdentity.id

@description('Agora MI client id — set as AZURE_CLIENT_ID for DefaultAzureCredential when the host has multiple assigned identities.')
output agoraIdentityClientId string = agoraIdentity.properties.clientId

@description('Agora MI object/principal id — what the RBAC role assignments target.')
output agoraIdentityPrincipalId string = agoraIdentity.properties.principalId

@description('Runner user-assigned MI resource id — assign this to the box runner host.')
output runnerIdentityResourceId string = runnerIdentity.id

@description('Runner MI client id — set as AZURE_CLIENT_ID for the runner DefaultAzureCredential when needed.')
output runnerIdentityClientId string = runnerIdentity.properties.clientId

@description('Runner MI object/principal id — what the runner RBAC role assignment targets.')
output runnerIdentityPrincipalId string = runnerIdentity.properties.principalId

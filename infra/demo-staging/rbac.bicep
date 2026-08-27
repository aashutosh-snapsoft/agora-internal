// ---------------------------------------------------------------------------
// Demo-staging keyless Blob plane — RBAC role assignments.
//
// Grants the three role assignments the keyless Blob plane requires
// (contracts/keyless-auth-contract.md). NO account key / connection string is
// involved anywhere — all auth is Azure AD identity (DefaultAzureCredential) +
// a user-delegation SAS signed via getUserDelegationKey().
//
//   Agora service identity   -> Storage Blob Data Contributor  (create containers, upload inputs)
//   Agora service identity   -> Storage Blob Delegator          (mint the user-delegation KEY that signs the SAS)
//   Agora service identity   -> Storage Table Data Contributor  (read/write the keyless per-user ownership registry — the demoProjects table)
//   Box runner identity      -> Storage Blob Data Contributor   (read inputs, write results)
//
// The `Storage Table Data Contributor` grant (contracts/ownership-registry-contract.md)
// lets Agora read/write the `demoProjects` ownership-registry table KEYLESS via the
// managed identity (DefaultAzureCredential) — same storage account as the Blob
// containers, no account key / connection string. It is the authorization seam that
// closes the authn≠authz gap on the demo routes.
//
// The `Storage Blob Delegator` grant is the non-obvious one: a user-delegation
// SAS is signed with a user-delegation KEY obtained via getUserDelegationKey(),
// which needs the generateUserDelegationKey/action permission carried by that
// role. Without it the SAS mint fails even though container CRUD works.
//
// All inputs are operator-supplied — nothing is hardcoded. Deploy with:
//   az deployment group create \
//     --resource-group <rg> \
//     --template-file infra/demo-staging/rbac.bicep \
//     --parameters storageAccountName=<account> \
//                  agoraPrincipalId=<agora-mi-object-id> \
//                  runnerPrincipalId=<runner-mi-object-id>
// ---------------------------------------------------------------------------

@description('Name of the existing storage account that holds the per-demo containers (NAME only — no key).')
param storageAccountName string

@description('Object (principal) id of the Agora service identity — the managed identity / service principal DefaultAzureCredential resolves for Agora.')
param agoraPrincipalId string

@description('Object (principal) id of the box runner identity — its OWN managed identity / service principal.')
param runnerPrincipalId string

@description('Principal type of the assigned identities. Use ServicePrincipal for MI/SP.')
@allowed([
  'ServicePrincipal'
  'User'
  'Group'
])
param principalType string = 'ServicePrincipal'

// Existing storage account — scope for all assignments.
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

// Built-in role definition ids (stable across tenants).
// Storage Blob Data Contributor: ba92f5b4-2d11-453d-a403-e96b0029c9fe
// Storage Blob Delegator:        db58b8e5-c6ad-4a2a-8342-4190687cbf4a
// Storage Table Data Contributor: 0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var storageBlobDelegatorRoleId = 'db58b8e5-c6ad-4a2a-8342-4190687cbf4a'
var storageTableDataContributorRoleId = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'

// --- Agora: Storage Blob Data Contributor (create containers, upload inputs) ---
resource agoraDataContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, agoraPrincipalId, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: agoraPrincipalId
    principalType: principalType
  }
}

// --- Agora: Storage Blob Delegator (mint the user-delegation key for the keyless SAS) ---
resource agoraDelegator 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, agoraPrincipalId, storageBlobDelegatorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDelegatorRoleId)
    principalId: agoraPrincipalId
    principalType: principalType
  }
}

// --- Agora: Storage Table Data Contributor (keyless read/write of the demoProjects ownership registry) ---
resource agoraTableDataContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, agoraPrincipalId, storageTableDataContributorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageTableDataContributorRoleId)
    principalId: agoraPrincipalId
    principalType: principalType
  }
}

// --- Box runner: Storage Blob Data Contributor (read inputs, write results) ---
resource runnerDataContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, runnerPrincipalId, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: runnerPrincipalId
    principalType: principalType
  }
}

output agoraDataContributorAssignmentId string = agoraDataContributor.id
output agoraDelegatorAssignmentId string = agoraDelegator.id
output agoraTableDataContributorAssignmentId string = agoraTableDataContributor.id
output runnerDataContributorAssignmentId string = runnerDataContributor.id

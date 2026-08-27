# Demo-staging keyless Blob plane — RBAC scaffolding

This directory holds the Azure RBAC the operator provisions so the demo-staging
Blob plane works **keyless** — no account key, no connection string, ever
(`contracts/keyless-auth-contract.md`). All Blob auth is Azure AD identity
(`DefaultAzureCredential`) plus a user-delegation SAS signed via
`getUserDelegationKey()`.

## Roles granted

| Identity | Role | Scope | Why |
|----------|------|-------|-----|
| Agora service identity | `Storage Blob Data Contributor` | the storage account | create containers, upload inputs |
| Agora service identity | `Storage Blob Delegator` | the storage account | mint the user-delegation key that signs the keyless SAS |
| Box runner identity | `Storage Blob Data Contributor` | the storage account | read inputs, write results |

**`Storage Blob Delegator` is the easy miss.** A user-delegation SAS is signed
with a user-delegation *key* obtained from `getUserDelegationKey()`, which needs
the `Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action`
permission carried by that role. Without it, the SAS mint fails even though
container CRUD works. The Bicep grants it explicitly.

## Operator-supplied inputs (nothing is hardcoded)

| Input | What it is |
|-------|------------|
| `storageAccountName` | The storage account **name** only (e.g. `socraticsdemostg`). No key, no connection string. Same value Agora reads as `AZURE_STORAGE_ACCOUNT`. |
| `agoraPrincipalId` | Object id of the Agora managed identity / service principal `DefaultAzureCredential` resolves. |
| `runnerPrincipalId` | Object id of the box runner's own managed identity / service principal. |

## Deploy — Bicep

```bash
az deployment group create \
  --resource-group "<rg>" \
  --template-file infra/demo-staging/rbac.bicep \
  --parameters storageAccountName="<account>" \
               agoraPrincipalId="<agora-mi-object-id>" \
               runnerPrincipalId="<runner-mi-object-id>"
```

## Deploy — `az` CLI (equivalent, no Bicep)

```bash
# Operator-supplied values
ACCOUNT="<account>"                # storage account NAME only
RG="<rg>"
AGORA_PRINCIPAL_ID="<agora-mi-object-id>"
RUNNER_PRINCIPAL_ID="<runner-mi-object-id>"

SCOPE="$(az storage account show --name "$ACCOUNT" --resource-group "$RG" --query id -o tsv)"

# Agora: create containers + upload inputs
az role assignment create \
  --assignee-object-id "$AGORA_PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Data Contributor" \
  --scope "$SCOPE"

# Agora: mint the user-delegation key for the keyless SAS (the easy miss)
az role assignment create \
  --assignee-object-id "$AGORA_PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Delegator" \
  --scope "$SCOPE"

# Box runner: read inputs + write results
az role assignment create \
  --assignee-object-id "$RUNNER_PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Data Contributor" \
  --scope "$SCOPE"
```

> Role assignments can take a minute or two to propagate. If the first SAS mint
> returns `AuthorizationPermissionMismatch`, wait and retry — it usually means
> the `Storage Blob Delegator` assignment has not propagated yet.

## What this does NOT create

The storage account itself and the identities (managed identities / service
principals) are operator-owned prerequisites — this scaffolding only grants the
roles on an existing account to existing principals. No secrets are stored or
committed here.

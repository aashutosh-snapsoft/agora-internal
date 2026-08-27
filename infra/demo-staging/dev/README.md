# Demo-staging — DEV resource provisioning

**DEV-ONLY.** This template *creates* the resources the demo-staging feature needs
in a throwaway dev resource group, then composes the sibling [`../rbac.bicep`](../rbac.bicep)
to grant the keyless RBAC on what it just created.

The parent [`../README.md`](../README.md) covers the RBAC-only path for an account and
identities the operator already owns (the prod/shared posture). **This** template is the
opposite: it stands up a self-contained dev environment from nothing.

## What `main.bicep` provisions

| Resource | Notes |
|----------|-------|
| **Storage account** (Standard StorageV2, Blob + Table services) | `allowSharedKeyAccess: false` — no account key exists at all, which *is* the keyless contract. Blob containers + the `demoProjects` Table both live here. The table is created up front. |
| **Agora user-assigned managed identity** | Operator assigns it to the dev Agora container app. `DefaultAzureCredential` resolves it with no key in the container. |
| **Box runner user-assigned managed identity** | Operator assigns it to the runner host. The runner authenticates keyless with its own MI. |
| **RBAC role assignments** (via `../rbac.bicep` module) | Agora → `Storage Blob Data Contributor` + `Storage Blob Delegator` + `Storage Table Data Contributor`; runner → `Storage Blob Data Contributor`. |

The role-assignment logic is **not duplicated** — `main.bicep` invokes `../rbac.bicep`
as a module, passing the principal ids of the two identities it just created.

## Parameters

| Parameter | Default | What it is |
|-----------|---------|------------|
| `namePrefix` | `agorademo` | Short (3–11 char) lowercase prefix. Storage account name = `<prefix><uniqueString(rg)>` (≤ 24 chars). Identity names = `<prefix>-agora-mi` / `<prefix>-runner-mi`. |
| `location` | RG location | Azure region for all dev resources. |
| `storageSku` | `Standard_LRS` | Cheap dev default. |
| `principalType` | `ServicePrincipal` | Correct for user-assigned MIs. |
| `allowedCorsOrigins` | **none (required)** | Array of the exact Agora dev origin(s) (scheme + host, e.g. `https://<agora-dev-host>`) allowed to call the Blob service from the browser. See [Browser CORS for the Blob service](#browser-cors-for-the-blob-service) below. No default is baked in — the operator MUST supply it. |

### Browser CORS for the Blob service

The demo page runs a self-service file browser (list / upload / download) directly in
the browser against the per-demo container's **user-delegation SAS** (`@azure/storage-blob`
`ContainerClient`, SAS URL only — no key). A cross-origin browser call to Azure Storage
first issues a CORS **preflight** (`OPTIONS`); without a matching CORS rule on the Blob
service the browser blocks every list/upload/download. `main.bicep` therefore sets one
`corsRules` entry on the `blobService` (`default`) resource:

| Field | Value | Why |
|-------|-------|-----|
| `allowedOrigins` | `allowedCorsOrigins` (param) | The exact Agora dev origin(s) — scheme + host. **No `*` wildcard**: the SAS is the capability; CORS is defense-in-depth on *which page* may call. |
| `allowedMethods` | `GET, PUT, OPTIONS, HEAD` | GET = list + download, PUT = upload, OPTIONS = preflight, HEAD = blob props. **No `DELETE`** — self-service is list/upload/download only. |
| `allowedHeaders` | `*` | The SDK sets `x-ms-*` and content headers; `*` is standard and acceptable for a dev blob CORS rule. |
| `exposedHeaders` | `*` | Lets the SDK read response headers it needs. |
| `maxAgeInSeconds` | `3600` | How long the browser may cache the preflight result. |

**Keyless posture is unaffected.** CORS governs the browser preflight, not
authentication — it does not touch `allowSharedKeyAccess: false`, the RBAC role
assignments, or the SAS signing path. Auth is still Azure-AD user-delegation only.

**Supplying the value.** `allowedCorsOrigins` has no in-template default, so the operator
provides it at deploy time — add it to `main.dev.bicepparam`, e.g.

```bicep
param allowedCorsOrigins = [
  'https://<agora-dev-host>'
]
```

…or pass it inline: `--parameters allowedCorsOrigins='["https://<agora-dev-host>"]'`.

**Scope.** This is the **dev** account (`agorademodev`-class name, i.e.
`<namePrefix><uniqueString(rg)>`) in a throwaway dev resource group such as
`rg-dev-playground`. **Prod CORS / deploy rollout is out of scope** for this change —
prod origins are configured separately when the prod posture is stood up.

## Deploy against a dev RG

```bash
# Create the dev resource group (once)
az group create --name <dev-rg> --location <region>

# Provision everything (account + 2 MIs + RBAC) in one deployment
az deployment group create \
  --resource-group <dev-rg> \
  --template-file infra/demo-staging/dev/main.bicep \
  --parameters infra/demo-staging/dev/main.dev.bicepparam

# …or pass parameters inline instead of the .bicepparam file:
az deployment group create \
  --resource-group <dev-rg> \
  --template-file infra/demo-staging/dev/main.bicep \
  --parameters namePrefix=agorademo storageSku=Standard_LRS
```

## Outputs the operator needs

After the deployment, read the outputs (the values to wire `DefaultAzureCredential`
and to assign the MIs to the hosts):

```bash
az deployment group show \
  --resource-group <dev-rg> \
  --name main \
  --query properties.outputs
```

| Output | Use it for |
|--------|------------|
| `storageAccountName` | Set as `AZURE_STORAGE_ACCOUNT` for both Agora and the runner. |
| `ownershipTableName` | `demoProjects` (frozen by contract). |
| `agoraIdentityResourceId` | Assign this user-assigned MI to the dev Agora container app. |
| `agoraIdentityClientId` | Set as `AZURE_CLIENT_ID` for Agora when the host carries more than one assigned identity. |
| `agoraIdentityPrincipalId` | The object id the Agora RBAC grants target (informational — already wired by the module). |
| `runnerIdentityResourceId` | Assign this user-assigned MI to the box runner host. |
| `runnerIdentityClientId` | Set as `AZURE_CLIENT_ID` for the runner when needed. |
| `runnerIdentityPrincipalId` | The object id the runner RBAC grant targets (informational). |

> The host-side runner daemon is operator-run elsewhere (see
> [`../../../demo-runner/README.md`](../../../demo-runner/README.md)); this template only
> provisions its identity so it can authenticate keyless.

## Teardown

It is a dev RG — delete the whole group when done:

```bash
az group delete --name <dev-rg> --yes
```

## Relationship to the keyless contract

`allowSharedKeyAccess: false` is the structural enforcement of
`contracts/keyless-auth-contract.md`: there is no account key to leak, so every code
path is forced onto `DefaultAzureCredential`. `getUserDelegationKey()` (which signs the
read+list SAS) is an Azure AD operation, so it keeps working with shared-key access off.

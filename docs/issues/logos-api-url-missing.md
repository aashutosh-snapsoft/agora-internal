# LOGOS_API_URL Missing Server-Side Environment Variable

**Date:** 2026-01-17  
**Status:** Fixed  
**Commit:** c2845b8

## Problem

File uploads were failing in deployed environments with the error:
```
Upload failed: Server misconfiguration: LOGOS_API_URL missing
```

Browser console showed:
```javascript
[Upload Thunk] Upload failed: {
  status: 500,
  statusText: "",
  errorMessage: "Server misconfiguration: LOGOS_API_URL missing",
  projectId: "6a11ac6a-0fef-4e5e-a11f-6b4450f29dca"
}
```

## Root Cause

PR #269 (commit `7d47c77` - "Refactor auth to middleware enforcement and BFF session lookup") changed how the upload route accesses the Logos API URL:

**Before (commit e197008):**
```typescript
import { config } from "@/config";
let logosUrl = config.logos_url; // Uses NEXT_PUBLIC_LOGOS_URL
```

**After (commit 7d47c77):**
```typescript
const logosUrl = process.env.LOGOS_API_URL; // New server-side variable
```

### Why the Change?

The authentication refactor removed the `config` object pattern in favor of direct environment variable access. The new code expects `LOGOS_API_URL` (server-side only) instead of `NEXT_PUBLIC_LOGOS_URL` (client-side, baked at build time).

### The Missing Link

The Bicep deployment template (`deployments/ACS/agora-vnet-deployment.bicep`) was created in PR #258 and sets:
```bicep
{ name: 'NEXT_PUBLIC_LOGOS_URL', value: logosApiUrl }
```

But it **never set** `LOGOS_API_URL` (the server-side variable), causing the upload route to fail.

## Solution

### Discovery: Two Deployment Templates

There are **TWO** Bicep deployment templates:

1. **`agora-vnet-deployment.bicep`** - Used by `deploy-agora-vnet.yml` workflow
2. **`azure-container-app.bicep`** - Used by `deploy-agora.yml` workflow

**Both templates needed to be fixed.**

### Fix Applied

Added `LOGOS_API_URL` to both Bicep templates' environment variables sections:

**agora-vnet-deployment.bicep** (commit f3990c6):
```bicep
// Server-side only (API routes need non-prefixed vars)
{ name: 'LOGOS_API_URL', value: logosApiUrl }
```

**azure-container-app.bicep** (commit b2ca5e1):
```bicep
{
  name: 'LOGOS_API_URL'
  value: logosUrl
}
```

Both map to the Logos API URL parameter:
- Dev: `https://logos-ergon-dev.internal.westus2.azurecontainerapps.io/api/v1` or `https://logos.dev.socratics.ai/api/v1`
- Prod: `https://logos-ergon-prod.internal.westus2.azurecontainerapps.io/api/v1` or `https://logos.socratics.ai/api/v1`

## Files Modified

- `deployments/ACS/agora-vnet-deployment.bicep` (+3 lines) - Commit f3990c6
- `deployments/ACS/azure-container-app.bicep` (+4 lines) - Commit b2ca5e1
- `docs/issues/logos-api-url-missing.md` (this file)

## Key Lessons

1. **NEXT_PUBLIC_* variables** are baked into the client bundle at build time and accessible everywhere
2. **Non-prefixed variables** (like `LOGOS_API_URL`) are server-side only and must be explicitly set in deployment configs
3. **When refactoring from config patterns to direct env access**, check deployment templates to ensure they inject the required variables

## Related Issues

- PR #290: Fix for `azure-container-app.bicep` template (this PR)
- PR #289: Fix for `agora-vnet-deployment.bicep` template (merged)
- PR #288: Original JWT auth fix for `/api/projects/create`
- Issue #287: Root cause analysis and fix planning
- PR #269: Authentication refactor that changed variable names
- PR #258: VNet deployment workflow that created the Bicep template
- PR #285: VNet deployment workflow (related infrastructure)
- Original working code: commit e197008 ("Fixed upload functionality")

## Testing

After deploying with this fix:
1. Upload a file via the UI
2. Verify no "LOGOS_API_URL missing" errors
3. Check server logs to confirm upload forwarding to Logos service

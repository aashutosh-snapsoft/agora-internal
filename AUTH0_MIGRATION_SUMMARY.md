# Auth0 Migration Summary: SPA SDK → Next.js SDK - RWA

## Migration Status: IN PROGRESS

This document summarizes the migration from `@auth0/auth0-react` (SPA SDK) to `@auth0/nextjs-auth0` (Next.js SDK).

## ✅ Completed Steps

### Step 1: Auth0 Next.js SDK API Route
- **File**: `src/app/api/auth/[...auth0]/route.ts`
- **Status**: Created and configured
- **Routes Available**:
  - `/api/auth/login` - Initiates login
  - `/api/auth/logout` - Logs out user
  - `/api/auth/callback` - Handles OAuth callback (automatic)
  - `/api/auth/me` - Returns current user session

### Step 2: Environment Variables
- **File**: `src/config.ts`
- **Status**: Added support for server-side Auth0 config
- **New Environment Variables Required**:
  ```
  AUTH0_SECRET=<long_random_string>
  AUTH0_BASE_URL=<your_app_url>
  AUTH0_ISSUER_BASE_URL=https://<your-auth0-domain>.auth0.com
  AUTH0_CLIENT_ID=<regular_web_app_client_id>
  AUTH0_CLIENT_SECRET=<regular_web_app_client_secret>
  ```
- **Note**: Generate `AUTH0_SECRET` using: `openssl rand -hex 32`

### Step 3: Session Access Helpers
- **Files Created**:
  - `src/lib/auth0-session.ts` - Server-side session helpers
  - `src/hooks/useAuth0User.ts` - Client-side user hook
- **Status**: Implemented

### Step 4: Login/Logout Migration
- **Files Updated**:
  - `src/components/Login.tsx` - Now uses `/api/auth/login` and `/api/auth/logout`
  - `src/app/welcome/page.tsx` - Updated to use new login route
  - `src/app/logout/page.tsx` - Updated to use new logout route
  - `src/hooks/useLogout.ts` - Updated to use new logout route
- **Status**: Migrated

### Step 5: Upload API Routes
- **File**: `src/app/api/logos/projects/[projectId]/upload/route.ts`
- **Changes**:
  - Now uses `getSession()` for authentication
  - Uses `getAccessToken()` to get token from session
  - Removed client-side Authorization header requirement
- **Files Updated**:
  - `src/store/project-onboarding-document-upload/upload-thunks.ts` - Removed client-side token
  - `src/app/financial-model/UploadModal.tsx` - Now uses API route instead of direct upload

### Step 8: Layout Migration
- **File**: `src/app/layout.tsx`
- **Changes**:
  - Replaced `Auth0Provider` with `UserProvider` from `@auth0/nextjs-auth0/client`
  - Removed SPA SDK configuration
- **File**: `src/components/AppInitializer/AppInitializer.tsx`
- **Changes**: Updated to use `useAuth0User` hook

## ✅ Completed Additional Work

### Step 6: Remove SPA Token Management
**Files Updated:**
- All components now use `useAuth0User` instead of `useAuth0`
- `SocraticsAuthGuard.tsx` - Refactored to use session-based auth
- `error-handler.ts` - Updated to use Next.js Auth0 SDK routes
- `hasura.service.ts` - Updated error handling calls
- `useAuth.ts` - Updated to use `useAuth0User` for backward compatibility

**Note:** Redux token storage (`auth.ts`, `auth-thunks.ts`) is still present but no longer actively used by components. It can be removed in a future cleanup.

### Step 7: Role & Org Enforcement
**Files Updated:**
- `SocraticsAuthGuard.tsx` - Now validates user/tenant from fetched user data instead of token
- Role/org checking now reads from user data fetched from backend
- Server-side enforcement is in place via API route authentication

### Step 9: Cleanup
**Files Updated:**
- `useAuth.ts` - Updated to use new system (backward compatible)
- `error-handler.ts` - Removed SPA SDK dependencies
- `hasura.service.ts` - Updated to not require authContext

## 📝 Important Notes

### Environment Variables
**CRITICAL**: Before deploying, ensure these environment variables are set:
- `AUTH0_SECRET` - Must be a long random string
- `AUTH0_BASE_URL` - Your application URL
- `AUTH0_ISSUER_BASE_URL` - Your Auth0 domain (e.g., `https://your-domain.auth0.com`)
- `AUTH0_CLIENT_ID` - Regular Web Application client ID (NOT SPA client)
- `AUTH0_CLIENT_SECRET` - Regular Web Application client secret

### Auth0 Application Type
**IMPORTANT**: The Auth0 application must be configured as a **Regular Web Application**, not a Single Page Application.

### Session Cookies
- Sessions are now stored in HttpOnly cookies (server-side)
- No access tokens in browser storage
- No Authorization headers sent from client

### Upload Flow
- All uploads now go through `/api/logos/projects/[projectId]/upload`
- Server retrieves access token from session
- Client no longer sends Authorization headers

## 🧪 Testing Checklist

After completing remaining steps, verify:

- [ ] `/api/auth/login` works
- [ ] `/api/auth/callback` sets session cookie
- [ ] `/api/auth/me` returns user
- [ ] Protected pages redirect when logged out
- [ ] Upload works for authorized users
- [ ] Upload fails for unauthorized users
- [ ] Google login works
- [ ] No tokens in browser storage (check DevTools)
- [ ] No Authorization headers sent from client (check Network tab)
- [ ] Role/org enforcement works correctly
- [ ] Logout clears session

## 🚨 Breaking Changes

1. **Token Access**: Client-side code can no longer access access tokens directly
2. **Auth Context**: `useAuth0()` hook replaced with `useAuth0User()`
3. **Login/Logout**: Must use `/api/auth/login` and `/api/auth/logout` routes
4. **Uploads**: Must go through Next.js API routes (already implemented)

## 📚 References

- [Auth0 Next.js SDK Documentation](https://auth0.github.io/nextjs-auth0/)
- [Migration Guide](https://auth0.com/blog/introducing-the-auth0-next-js-sdk/)


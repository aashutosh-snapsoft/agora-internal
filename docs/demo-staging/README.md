# Demo-staging — operator guide (the one place that ties the three parts together)

A hidden, Auth0-gated control surface in Agora that hands a demo's input files to a
nousix/Claude run on the operator's Linux box and shows the result — keyless end to end.
This is a **demo aid, not a hardened product**: the access control is an unguessable slug +
the existing Auth0 gate, and Telegram is a swappable, demo-grade trigger transport.

This document is the single operator-facing overview. The two component READMEs own their
own detail and are **not** duplicated here:

- Azure RBAC / Bicep / `az` setup: [`infra/demo-staging/README.md`](../../infra/demo-staging/README.md)
- The box-side runner daemon: [`demo-runner/README.md`](../../demo-runner/README.md)

The three seams the parts compose through are frozen in the taskflow's `contracts/`
(Telegram job/done envelopes, container naming, env var names, the keyless-auth rule).

## The three parts

| Part | Where it lives | What it is |
|------|----------------|------------|
| 1. Hidden control UI | `src/app/demo/[token]/` + `src/middleware.ts` | Auth0-gated `/demo/<token>` page: create container, see the SAS link, upload inputs, Start processing, watch for "done". |
| 2. Keyless Blob plane | `src/lib/demo/azure-blob-keyless.ts` + `src/app/api/demo/[token]/{container,upload}/route.ts` + `infra/demo-staging/` | Creates a private per-demo container, issues a short-lived **user-delegation** SAS (read+list), uploads inputs. No account key, no connection string — `DefaultAzureCredential` only. |
| 3. Box runner | `demo-runner/` (standalone Node package, same repo) | Long-polls Telegram for a job, runs a **kernel-booting** nousix/Claude ingest of the container's inputs, writes results back into the **same** container, posts "done". |

Agora-side Telegram I/O (send job / poll for done) lives in `src/lib/demo/telegram.ts`,
behind `src/app/api/demo/[token]/{start,status}/route.ts`.

## The demo flow (end to end)

```
operator opens  /demo/<DEMO_ROUTE_TOKEN>   ──▶ Auth0 login (existing gate) ──▶ control UI
   │
   │ "Create container"   POST /api/demo/<token>/container
   ▼
Agora (Storage Blob Data Contributor) creates a private container
Agora (Storage Blob Delegator) mints a read+list user-delegation SAS  ──▶ { account, container, sas_url }
   │
   │ upload inputs        POST /api/demo/<token>/upload     (server-side, via Agora's MI)
   │ "Start processing"   POST /api/demo/<token>/start
   ▼
Agora sends  "AGORA_DEMO_JOB v1" + {account, container, sas_url, job_id, issued_at}  to the Telegram chat
   │
   ▼
box runner long-polls getUpdates ─▶ validates the job ─▶ downloads inputs (SAS or its own MI)
   ─▶ kernel-booting nousix/Claude ingest ─▶ writes results into the SAME container (its own MI)
   ─▶ posts  "AGORA_DEMO_DONE v1" + {job_id, status, result_blobs?, error?}
   │
   ▼
Agora UI polls  GET /api/demo/<token>/status?job_id=...  ─▶ correlates by job_id ─▶ shows succeeded/failed
```

Correlation between a start and its done is strictly by `job_id`. Inputs **and** results
live in the one per-demo container; the SAS link shown on the page lists/downloads both.

## Keyless, by contract

No account key, no connection string — anywhere, ever (`contracts/keyless-auth-contract.md`).
All Blob-plane auth is Azure AD identity via `DefaultAzureCredential`, and the presigned URL
is a **user-delegation** SAS (signed with `getUserDelegationKey()`, not the account key),
scoped to the one container, **read + list only**, short-lived. The runner therefore writes
results via its **own** managed identity (the SAS cannot write), never via the SAS.

## Operator setup (in order)

1. **Azure RBAC** — provision the three role assignments. Follow
   [`infra/demo-staging/README.md`](../../infra/demo-staging/README.md). The non-obvious one
   is **`Storage Blob Delegator`** on the Agora identity — without it the keyless SAS mint
   fails even though container CRUD works.

   | Identity | Role | Why |
   |----------|------|-----|
   | Agora service identity | `Storage Blob Data Contributor` | create containers, upload inputs |
   | Agora service identity | `Storage Blob Delegator` | mint the user-delegation key that signs the SAS |
   | Box runner identity | `Storage Blob Data Contributor` | read inputs, write results |

2. **Telegram** — create a bot with BotFather, note the bot token, and pick the chat the bot
   posts to (its numeric chat id). Agora and the runner both target this one chat.

3. **Agora env** (server-side; never sent to the browser; names frozen by
   `contracts/config-env.yaml`):

   | Variable | Required | Purpose |
   |----------|----------|---------|
   | `DEMO_STAGING_ENABLED` | yes (to enable) | Master feature flag for the **entire** demo surface (the `/demo/<token>` page + every `/api/demo/[token]/**` route). **Default OFF** — unset/`0`/`false`/`no`/`off` ⇒ the surface 404s everywhere. Set to `1`/`true`/`yes`/`on` to enable in a non-prod deploy. |
   | `DEMO_STAGING_DEPLOY_ENV` | recommended | Deploy-environment signal for the **hard prod guard**. Set to `prod` (or `production`) in production: the demo surface is then **always 404, regardless of `DEMO_STAGING_ENABLED`** — a misconfigured prod flag cannot expose it. Leave unset / set to `dev`/`staging` in non-prod. Independent of `NODE_ENV` (which is `production` for every built Next.js app, staging included). |
   | `AZURE_STORAGE_ACCOUNT` | yes | Storage account **name** only (no key). |
   | `DEMO_ROUTE_TOKEN` | yes | The unguessable slug that forms `/demo/<token>`. Rotating it disables the demo. |
   | `TELEGRAM_BOT_TOKEN` | yes | Bot token; server-side only. |
   | `TELEGRAM_CHAT_ID` | yes | The chat job/done messages flow through. |
   | `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_CLIENT_SECRET` | optional | SDK-standard `DefaultAzureCredential` trio for local/dev SP; prod uses MI (no secret). |

   > **Feature-flag + hard prod guard.** The whole demo surface is gated by
   > `DEMO_STAGING_ENABLED` (default OFF), AND by an independent hard prod guard:
   > when `DEMO_STAGING_DEPLOY_ENV` is `prod`/`production`, the surface is off no
   > matter what the flag says (defense in depth). Disabled → a `404` at the
   > middleware chokepoint and re-checked in every route handler + the page, so
   > there is no second-class path. To run the demo in a non-prod environment:
   > set `DEMO_STAGING_ENABLED=true` and leave `DEMO_STAGING_DEPLOY_ENV` non-prod.

4. **Box runner** — install, build, and run the daemon on the Linux box, and provision its
   own env + RBAC. Follow [`demo-runner/README.md`](../../demo-runner/README.md). The runner
   needs its own `Storage Blob Data Contributor` and the Claude CLI's own auth (Bedrock IAM
   role / API key) per the nousix install.

5. **Run the demo** — open `https://<agora-host>/demo/<DEMO_ROUTE_TOKEN>`, authenticate,
   create a container, upload inputs, press Start, and watch for the done notification.

> A wrong or unconfigured slug returns a 404 **before** any session lookup, so the hidden
> route does not reveal its own existence or any auth state. The page is unlinked from nav.

## Security posture (demo-grade, stated plainly)

- Access control = unguessable slug + Auth0 session. Sufficient for a demo; not a
  tenant-scoped surface.
- Telegram is the trigger transport as-is (operator provides the token). Agora's `/status`
  poll is a non-acking recent-window scan because the runner also long-polls the same bot;
  a webhook or distinct bots would be the production hardening.
- No secret value is committed anywhere. The bot token never reaches the browser. Done-message
  errors are scrubbed of SAS/token-shaped substrings before they leave the box.

## Shipping

This feature ships on a `socratics-feature` branch as a PR (the box runner rides the same PR
under `demo-runner/`). The Agora app and the standalone runner are built, type-checked, and
tested by their own toolchains (`npm test` at the repo root for Agora; `npm test` inside
`demo-runner/` for the runner — it uses `node --test`, not Agora's jest).

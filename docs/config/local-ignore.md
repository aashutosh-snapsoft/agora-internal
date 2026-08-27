# Local Development Configuration

For local development, we've configured Git to ignore changes to sensitive configuration files:

## Using Git's Local Exclude
Added `src/config.ts` to `.git/info/exclude` to prevent tracking untracked files.

## Using Git's Skip-Worktree
For already tracked files, we use:

```bash
git update-index --skip-worktree src/config.ts
```

To undo this:

```bash
git update-index --no-skip-worktree src/config.ts
```

This allows developers to maintain local configuration without affecting the shared repository.

# Rationale

We needed to do this because `src/config.ts` is the active config file and local changes should not be committed.
Prefer using `.env.local` (or `.env.development.local` for Docker Compose) instead of editing `src/config.ts`.

Notes:
- `src/config.live.ts` is a legacy placeholder-based variant and is not used by default.
- `src/config.local.ts` is a local-only variant if you choose to swap it in manually.

# 09 · Deployment

> ⚠️ **Gaps / TODO:** the repo has **no deployment configuration**: no `Dockerfile`, no `vercel.json`, no GitHub Actions or other CI/CD workflows, and no environment-specific config files. This page describes what the code needs to run, not an existing pipeline.

## What the app needs at runtime

| Requirement | Why |
|---|---|
| **A long-running Node.js server** (`next start`), or a platform that supports Next.js 16 server features | Server components, server actions, the `proxy.ts` edge logic, and route handlers |
| **PostgreSQL** reachable via `DATABASE_URL` | All data |
| **HTTPS** | Auth cookies are set with `secure: true`, so browsers won't send them over plain HTTP (except on `localhost`) |
| **Upstash Redis** | Every write action calls `realtime.emit` |
| **Outbound SMTP to Gmail** | Invite and reset emails |
| All env vars from [02](./02-getting-started.md#environment-variables) | `NEXT_PUBLIC_APP_URL` must be the public URL, or email links will point to localhost |

> Hosting note: `/api/realtime` keeps a streaming connection open. On serverless hosts with function time limits, those connections get cut and reconnect. The feed still works, but expect reconnects.

## Build process

```bash
npm ci
npm run build          # = prisma generate && next build
npx prisma migrate deploy
npm run start          # next start (port 3000 by default; set PORT to change)
```

- `prisma generate` writes the client to `app/generated/prisma` (gitignored), so it must run on the build machine. The `build` script does this.
- `next.config.ts` is empty (defaults). There's no `output: "standalone"`, so a container image needs the full `node_modules`.

## Environments

The code doesn't distinguish environments except for:

- `lib/prisma.ts` caches the client on `globalThis` only when `NODE_ENV !== "production"` (to survive hot reload in dev).
- `secure` cookies, which need HTTPS outside `localhost`.

Suggested per-environment settings:

| Variable | Local | Staging / production |
|---|---|---|
| `DATABASE_URL` | local Postgres | managed Postgres (separate DB per environment) |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | any random values | **unique strong secrets per environment**, stored in the host's secret manager |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | dev database | separate Upstash database per environment |
| `GMAIL_*`, `SMTP_USER` | test account | real sending account (consider a transactional email provider) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://<YOUR_DOMAIN>` |

## Deploy checklist

1. Review the remaining open items in [07 – Security findings](./07-auth-and-security.md#security-findings). The 🔴 items are fixed.
2. Set every environment variable on the host.
3. Run `npx prisma migrate deploy` against the production database **before** starting the new version.
4. First deploy only: `npx prisma db seed` to create permissions and roles. ⚠️ This also creates the three sample users from `users.json`, so change their passwords right away or remove them from the seed.
5. Build and start the app, then check that login, a create action and the activity feed all work.

## Rollback

There's no automated rollback. Manually:

- **App:** redeploy the previous git commit/build.
- **Database:** Prisma migrations only go forward (there are no down migrations). To roll back a schema change, write a new migration that reverses it, or restore from a database backup taken before `migrate deploy`.

> ⚠️ **Gaps / TODO**
> - Add CI (for example GitHub Actions) running `npm ci`, `npx tsc --noEmit`, `npm run lint` and (later) tests on every PR.
> - Decide on hosting and document it here.
> - Set up database backups before the first production migration.

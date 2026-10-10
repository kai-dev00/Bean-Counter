# 02 · Getting started

## Prerequisites

| Tool | Notes |
|---|---|
| **Node.js** | Not pinned in `package.json`. Use a current LTS (the project was developed on Node 24). |
| **npm** | The repo ships a `package-lock.json`, so use npm. |
| **PostgreSQL** | Any reachable instance (local, Docker, or hosted). |
| **Upstash Redis database** | Needed for the live activity feed. The app calls `realtime.emit(...)` on every write, so writes fail without valid credentials. See [Troubleshooting](./11-troubleshooting.md#writes-show-something-went-wrong-but-the-data-is-saved). |
| **Gmail account with an App Password** | Needed to send invite and password-reset emails. |

## Install

```bash
git clone <REPO_URL>
cd NextJS-Project
npm install
cp .env.example .env
```

Fill in `.env` using the table below, then:

```bash
npx prisma generate      # generates the client into app/generated/prisma (gitignored)
npx prisma migrate dev   # applies prisma/migrations to your database
npx prisma db seed       # runs prisma/seed.ts (configured in prisma.config.ts)
npm run dev
```

Open <http://localhost:3000>. `/` redirects to `/login`.

### First login

The seed creates three users (one per role) from [`prisma/data/users.json`](../prisma/data/users.json). That file is where their emails and **plain-text starter passwords** live.

> ⚠️ Change those passwords before any shared or production use (or edit `users.json` before seeding). Don't commit real credentials to this file.

## Environment variables

Defined in [`.env.example`](../.env.example). `prisma.config.ts` loads `.env` through `dotenv/config`, and Next.js loads it automatically.

| Name | Purpose | Required? | Example |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma (app, migrations and seed) | ✅ | `postgresql://<USER>:<PASSWORD>@localhost:5432/<DB_NAME>?schema=public` |
| `ACCESS_TOKEN_SECRET` | HMAC secret for the 15-minute access JWT ([`lib/jwt.ts`](../lib/jwt.ts)) | ✅ | `<64-char random hex>` |
| `REFRESH_TOKEN_SECRET` | HMAC secret for the 7-day refresh JWT. Must be different from the access secret | ✅ | `<64-char random hex>` |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint for realtime ([`lib/upstash/redis.ts`](../lib/upstash/redis.ts)) | ✅ (writes fail without it) | `https://<YOUR_DB>.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token | ✅ | `<YOUR_UPSTASH_TOKEN>` |
| `GMAIL_USER` | Gmail account used to authenticate to SMTP ([`lib/email/index.ts`](../lib/email/index.ts)) | ✅ for invites/resets | `<you@gmail.com>` |
| `GMAIL_PASS` | **Google App Password** (not your login password) | ✅ for invites/resets | `<16-char app password>` |
| `SMTP_USER` | Address shown in the email `From:` header | ✅ for invites/resets | `<you@gmail.com>` |
| `NEXT_PUBLIC_APP_URL` | Base URL used to build invite (`/register/<token>`) and reset (`/resetPassword/<token>`) links | ✅ | `http://localhost:3000` |

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ **Gaps / TODO**
> - Env vars aren't checked at startup. `lib/jwt.ts` and `lib/upstash/redis.ts` use the `!` non-null assertion, so a missing value only fails later at runtime.
> - `NEXT_PUBLIC_APP_URL` gets bundled into client code because of the `NEXT_PUBLIC_` prefix. That's harmless (it's just a URL), but no client code actually uses it.

## npm scripts

From [`package.json`](../package.json):

| Script | Command | Use |
|---|---|---|
| `npm run dev` | `next dev` | Dev server with Turbopack on port 3000 |
| `npm run build` | `prisma generate && next build` | Production build (regenerates the Prisma client first) |
| `npm run start` | `next start` | Serve the production build |
| `npm run lint` | `eslint` | Lint the project |

Useful commands that aren't scripts:

| Command | Use |
|---|---|
| `npx tsc --noEmit` | Type-check the whole project |
| `npx prisma studio` | Browse and edit the database in a GUI |
| `npx prisma migrate dev --name <change>` | Create a new migration after editing `schema.prisma` |
| `npx prisma migrate reset` | Drop, re-migrate and re-seed the dev database (**deletes all data**) |
| `npx prisma db seed` | Re-run the seed. It upserts, so running it twice is safe |

> ⚠️ **Gaps / TODO**
> - No `postinstall` script runs `prisma generate`, so a fresh clone fails to compile until you run it by hand (the generated client is gitignored).
> - No `seed`, `typecheck` or `test` npm scripts.

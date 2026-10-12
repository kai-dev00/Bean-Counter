# 11 · Troubleshooting

## Setup and build

### `Cannot find module '@/app/generated/prisma/client'`

The Prisma client is generated into `app/generated/prisma`, which is gitignored, and nothing generates it automatically after install.

```bash
npx prisma generate
```

Run it again after every change to `prisma/schema.prisma`. `npm run build` does this for you.

### Seed fails, or `DATABASE_URL` is undefined

`prisma.config.ts` loads `.env` through `dotenv/config`. Make sure `.env` exists in the project root (not just `.env.example`) and that the database is reachable. The seed prints the URL it's using at startup, so check that log line, and **don't paste it anywhere public** because it contains your DB password.

### `npx tsc --noEmit` reports errors in `accessManagement/roles`

These were already there: `Permission.description` is `string | null` in Prisma but typed `string` in the local `Permission` type in `app/dashboard/accessManagement/components/RolesManagementForm.tsx`. They don't block `next dev`. Fix the type to `string | null` to clear them.

## Runtime errors

### The live activity feed doesn't update

Actions call `emitActivity(...)` after writing. If the Upstash credentials are missing or wrong, the emit fails, the error is logged to the server console (`Realtime emit failed:`), and the write still succeeds. Set valid `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

### Delete fails with "… can't be deleted" (Prisma `P2003`)

These records can't be deleted while other rows reference them, and the action says why:

- **Inventory item** that appears in any purchase (`PurchaseItem.inventoryId` has no cascade). Mark it discontinued instead.
- **Category** that still has items (`Inventory.categoryId` is `ON DELETE RESTRICT`). Move or delete the items first.
- **Supplier** that has purchases
- **Role** assigned to users or invites

### Create fails for a duplicate name (Prisma `P2002`)

`Inventory.name`, `Category.name`, `Supplier.name`, `Role.name`, `User.email` and `UserInvite.email` are unique. The action returns a message like "A category with this name already exists."

### "A tree hydrated but some attributes … didn't match"

Seen on the dashboard charts. shadcn's `ChartContainer` generated its id with `useId()`, which came out different on the server and the client. **Fixed** by passing a fixed `id` to each `ChartContainer` (`spend-over-time`, `top-suppliers`, `stock-health`). If you add a chart, give it a unique `id` too.

Browser extensions that modify the page (password managers, translators) can trigger the same warning. Try an incognito window to rule them out.

### `React.Children.only expected to receive a single React element child`

This happens with `CustomButton asChild` (Radix `Slot`) when it receives more than one child. `CustomButton` now skips the loading spinner when `asChild` is set. If you see it again, make sure the element inside `asChild` is a **single** element (wrap extra children inside it).

### Stuck on `/login`, or redirected back to login after logging in

- Auth cookies are `secure: true`. Over plain HTTP on anything other than `localhost` (for example a LAN IP or a staging server without TLS), the browser drops them. Use HTTPS, or `localhost` for development.
- If `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` changed, existing tokens stop verifying. Log in again.
- `/api/auth/refresh` logs `🔄 Refresh API called` / `❌ Refresh failed:` to the server console. Check it for the reason.

### Deactivated user can still log in

Deactivated users (`isActive = false`) are rejected at login and on token refresh, and lose the realtime feed.

### MODERATOR users are missing permissions

Databases seeded before the `roles.json` fix gave MODERATOR no category, users or roles permissions. Re-run `npx prisma db seed` (the role upsert replaces its permission set) or tick the permissions in **Role Management**.

## Email

### Invite or reset email never arrives (`EAUTH` / `Invalid login`)

- `GMAIL_PASS` must be a **Google App Password** (needs 2-step verification on the account), not the normal password.
- `GMAIL_USER` must be the account the app password belongs to.
- Check the spam folder. `SMTP_USER` sets the `From:` address.

### Email links point to `localhost`

Set `NEXT_PUBLIC_APP_URL` to the public URL of the deployment.

## Debugging tips

| Need | How |
|---|---|
| See or edit data | `npx prisma studio` |
| See SQL queries | Pass `log: ["query"]` to `new PrismaClient(...)` in `lib/prisma.ts` (the seed already does) |
| Check auth cookies | DevTools → Application → Cookies (`access_token`, `refresh_token`). Paste a token into a JWT decoder to see `sub`, `roleId`, `exp`. ⚠️ Never paste production tokens into online tools |
| Find what changed a record | Query `ActionLog` by `recordId`. `before` / `after` hold full snapshots |
| Server action errors | They show in the terminal running `npm run dev`. The client only shows a toast |
| Reset local data | `npx prisma migrate reset` (deletes everything and re-seeds) |

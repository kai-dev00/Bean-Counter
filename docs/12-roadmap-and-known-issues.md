# 12 · Roadmap & known issues

## TODO / FIXME comments in code

**There are none.** Searching `app/`, `components/`, `lib/`, `prisma/` and `proxy.ts` finds no `TODO`, `FIXME`, `HACK` or `@ts-ignore` comments.

The team keeps a personal notes file instead: [`todo's.ts`](../todo's.ts). It's listed in `.gitignore` but was committed before that, so it's still tracked. These are the items **not** marked done:

| Date | Note (paraphrased from the file) | Status in the code today |
|---|---|---|
| 2/15/2026 | Add primary and secondary colours to the theme | ✅ Mostly done: theme tokens now use the Prussian Blue / Orange palette (`app/globals.css`) |
| 2/15/2026 | Add text label variants | ❌ No typography/label variant component |
| 2/16/2026 | Fix the main module name in the access-management audit log (logger uses the model name, which doesn't match `access-management`) | ❌ Still open: `ActionLog.module` stores `userInvite`/`role`/`user` |
| 2/17/2026 | Change `Float` to `Decimal` for the category total price | ❌ `Category.totalPrice` is still `Float` (and unused) |
| 2/17/2026 | Enhance the profile page | ❌ Profile only shows details and the change-password form |
| 2/17/2026 | Enhance the table component UI | ✅ Done since (search icon, multi-filters, empty states, numeric columns) |
| 3/1/2026 | Decide whether recent-activity clicks should navigate to the record | ✅ Implemented (`handleActivityClick` → `?search=<id>`) |
| 3/2/2026 | Configure purchase and purchase-item modules | ✅ Implemented |
| 3/7/2026 | Total amount for inventory and purchases / add history to inventory | ✅ Total value column and purchase history in the inventory view |
| 3/7/2026 | Change `updatedAt` for access management in the schema | ❓ Unclear what was intended; `User`/`UserInvite`/`Role` have `updatedAt DateTime?` |

## Known bugs

| Bug | Impact | Location |
|---|---|---|
| Most server actions skip server-side permission checks | Any logged-in user can create, edit or delete anything | `app/dashboard/*/actions.ts`, `accessManagement/actions/*.ts`. See [07](./07-auth-and-security.md#security-findings) |
| `logoutAction` revokes every user's sessions | Everyone gets logged out when access tokens expire | `app/actions/auth.logout.ts` |
| `isActive` not checked at login or refresh | Deactivating a user doesn't block them | `auth.login.ts`, `auth.refresh.ts` |
| Debug route `/api/test-edit-user` | Public endpoint that calls a privileged action | `app/api/test-edit-user/route.ts` |
| MODERATOR seed uses wrong module names | The role gets no category or users/roles permissions | `prisma/data/roles.json` |
| `/dashboard/accessManagement` redirects to a non-existent path | 404 | `app/dashboard/accessManagement/page.tsx` |
| `revalidatePath("/roles")` uses the wrong path | Does nothing (pages refresh via `router.refresh()` anyway) | `accessManagement/actions/roles.ts` |
| Multi-step writes aren't transactional | Partial updates possible in `updatePurchase` / `receivePurchase`. Audit log rows can go missing | `purchase/actions.ts`, `lib/types/prismaLogger.ts` |
| `realtime.emit` failure fails the action after the DB write | Saved data reported as an error | all actions |
| Deleting an inventory, category or supplier that has purchases | Generic error (FK violation) | see [11](./11-troubleshooting.md#delete-fails-with-a-foreign-key-error-prisma-p2003) |
| Hooks called after an early `return <NoPermission />` | Lint errors (`react-hooks/rules-of-hooks`). Can crash if permissions change between renders | `AccessManagementClient.tsx`, `PurchaseClient.tsx`, `inventoryTable.tsx`, and others |
| `inventoryTable.tsx` checks `can("category:read")` instead of `inventory:read` | Wrong permission gate on the inventory table | `app/dashboard/inventory/components/inventoryTable.tsx` |
| Type errors in role pages | `tsc` fails (`Permission.description` nullability) | `RolesManagementForm.tsx` |

## Known limitations

- **No sales or consumption tracking.** Stock only goes up (purchase receipts) or changes by manual edit. There's no record of usage, so stock turnover or cost of goods can't be calculated.
- **Spend is grouped by purchase `createdAt`.** There's no `receivedAt` field.
- **Hardcoded trends** on the Inventory page stats cards ("▼5% from last week", "▲2%") aren't based on data (`InventoryClient.tsx`).
- **Everything loads at once.** Pages fetch every row and `DataTable` paginates in the browser, which will slow down as data grows.
- **Sidebar shows every link to every user.** The `permission` field on nav items isn't used.
- **`dashboard:read` permission is never checked.**
- **`Session` and `PasswordReset` rows are never cleaned up.**
- **Single currency (₱) and English only.**
- **No automated tests, CI or deployment config** (see [08](./08-testing.md), [09](./09-deployment.md)).
- **Unused code:** `jsonwebtoken` dependency, `getRecentActivity` (`_dashboard-hooks`), `AuthProvider` / `useAuth` (provided but never consumed), `components/ui/select.tsx`, `components/ui/dropdown-menu.tsx`, `Category.totalPrice` column, `permissions` field returned by `verifyAccessToken`.

## Suggested improvements (priority order)

1. **Enforce permissions on the server:** `requirePermission` in every action and every `page.tsx`, and filter the sidebar by permission.
2. **Fix the auth bugs:** per-user logout, the `isActive` check, `returnTo` validation, delete `/api/test-edit-user`, and protect `/api/realtime`.
3. **Add rate limiting** to login and forgot-password (Upstash Ratelimit).
4. **Validate on the server** with the existing Zod schemas. Unify the password policy.
5. **Use transactions** for purchase update/receive and for audit log inserts. Make `realtime.emit` best-effort (`try/catch`).
6. **Friendly errors** for FK and unique violations (`P2003`, `P2002`).
7. **Add testing and CI:** Vitest + Playwright, and a GitHub Actions workflow running `tsc`, lint and tests.
8. **Data model:** add `receivedAt` to `Purchase`, indexes on `PurchaseItem` foreign keys, drop or fix `Category.totalPrice`, and a stock-movement table for usage and adjustments.
9. **Server-side pagination and search** for large tables.
10. **Housekeeping:** fix the hook-order lint errors, remove unused code and dependencies, replace the template root `README.md`, add a `postinstall: prisma generate` script, and stop tracking `todo's.ts` (`git rm --cached "todo's.ts"`).

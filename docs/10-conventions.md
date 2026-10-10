# 10 · Conventions

These conventions come from the existing code. There's no Prettier config or style guide file, so follow what's here.

## Code style

- **TypeScript `strict`**, path alias `@/*` → project root (`@/lib/prisma`, `@/components/...`).
- **Formatting:** Prettier defaults (2 spaces, double quotes, trailing commas, semicolons) match the codebase. There's no `.prettierrc`, so run `npx prettier --write <files>` on what you touch.
- **Linting:** `npm run lint` (`eslint-config-next` core-web-vitals + TypeScript).
- **Styling:** Tailwind utility classes with **theme tokens** (`bg-card`, `text-muted-foreground`, `text-destructive`, `bg-primary`…). Don't hardcode colours like `bg-white` or `text-gray-600`, or dark mode breaks. Merge conditional classes with `cn()` from `@/lib/utils`.
- **Money and numbers:** `Decimal` in the DB. Convert with `.toNumber()` in `page.tsx` before passing to client components. Display with `formatPeso` / `formatUnit`.
- **Comments:** short and explain *why*. A few comments in the code are in Tagalog/Taglish.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Route folders | camelCase (existing) | `accessManagement/`, `forgotPassword/` |
| Private folders (not routes) | `_` prefix | `_dashboard-components/`, `_dashboard-hooks/` |
| Client page components | `PascalCase` + `Client` | `InventoryClient.tsx`, `PurchaseClient.tsx` |
| Module components | camelCase or PascalCase (mixed today) | `inventoryTable.tsx`, `SupplierTable.tsx` |
| Shared components | `Custom*` for app-level wrappers | `CustomButton`, `CustomDropdown`, `CustomInput` |
| Server actions | verb + noun, or `…Action` in auth/access | `createInventory`, `receivePurchase`, `loginAction` |
| Auth action files | `auth.<name>.ts` | `app/actions/auth.reset-password.ts` |
| Permission strings | `module:action[:submodule]`, lowercase, kebab-case modules | `access-management:update:roles` |
| Zod schemas / types | `<thing>Schema`, `<Thing>FormValues` | `purchaseSchema`, `PurchaseFormValues` |

## Folder conventions

- One folder per feature module under `app/dashboard/<module>/`, containing `page.tsx`, `<Module>Client.tsx`, `actions.ts`, an optional `schema.ts`, and `components/`.
- Shared UI goes in `components/`. Raw shadcn primitives go in `components/ui/` (add them with the shadcn CLI, configured in `components.json`).
- Server-only helpers go in `lib/`.
- Every DB write should go through `createWithLog` / `updateWithLog` / `deleteWithLog` so it's audited, followed by `realtime.emit("activity.created", …)`.

## Git workflow

From the history (PRs #4–#18):

- `main` is the integration branch. Work happens on short-lived branches merged through **GitHub pull requests**.
- Branch prefixes: `feature/<area>/<description>`, `enhancement/<area>`, `fix/<description>` (e.g. `feature/dashboard/data`, `enhancement/prisma-schema`, `fix/pachage-json`).
- Commit messages are short, imperative or past-tense summaries ("added purchase module", "Datefilters for table and dashboard data"). No enforced format such as Conventional Commits.

> ⚠️ No branch protection, PR template or commit hooks are configured in the repo.

## Adding a new feature module, end to end

Example: a **"Waste Log"** module for recording spoiled stock.

1. **Schema:** add the model in `prisma/schema.prisma`:

   ```prisma
   model WasteLog {
     id          String    @id @default(uuid())
     inventoryId String
     quantity    Decimal
     reason      String?
     createdAt   DateTime  @default(now())
     createdBy   String?
     inventory   Inventory @relation(fields: [inventoryId], references: [id])
     @@index([inventoryId])
   }
   ```

   Add `wasteLogs WasteLog[]` to `Inventory`, then run `npx prisma migrate dev --name add_waste_log`.

2. **Permissions:** add `{ "action": "read", "module": "waste" }` (and create/update/delete) to `prisma/data/permissions.json`. Run `npx prisma db seed` and assign the permissions to roles in the UI.

3. **Server actions:** create `app/dashboard/waste/actions.ts`:

   ```ts
   "use server";
   import { requirePermission } from "@/lib/auth-guard";
   import { getCurrentUserWithName } from "@/lib/auth";
   import { createWithLog } from "@/lib/types/prismaLogger";
   import { realtime } from "@/lib/upstash/realtime";
   import { wasteSchema, WasteFormValues } from "./schema";

   export async function createWaste(values: WasteFormValues) {
     await requirePermission("waste:create");          // enforce on the server
     const data = wasteSchema.parse(values);           // validate on the server
     const user = await getCurrentUserWithName();
     const row = await createWithLog<{ id: string }>(
       "wasteLog",
       { ...data, createdBy: user?.fullName ?? "System" },
       { userId: user?.userId ?? null, submodule: "" },
     );
     await realtime.emit("activity.created", {
       action: "create", module: "waste", submodule: null,
       recordId: row.id, user: user?.fullName ?? null,
       createdAt: new Date().toISOString(),
     });
     return { success: true };
   }
   ```

4. **Validation:** put `wasteSchema` (Zod) in `app/dashboard/waste/schema.ts` and use it in both the form and the action.

5. **Page:** in `app/dashboard/waste/page.tsx`, call `requirePermission("waste:read")`, query with Prisma, convert `Decimal` → `number`, load permissions with `getCurrentUserWithDetails()`, and render `<WasteClient …/>`. Add `export const metadata = { title: "Waste Log" }`.

6. **Client:** `WasteClient.tsx` uses `usePermission(permissions)`, `PageCard`, `DataTable` (mark quantity columns `numeric: true`, add `filters`), a `CustomModal` with the form (React Hook Form + `zodResolver`, `CustomInput` / `CustomDropdown` / `CustomButton`), and calls `router.refresh()` after saving.

7. **Navigation:** add an entry to `navItems` in `app/dashboard/sidebar.tsx`, a title in `routeTitles` in `app/dashboard/header.tsx`, and `waste: "/dashboard/waste"` to `moduleRoutes` in `dashboardClient.tsx` so activity items link to it.

8. **Check:** run `npx tsc --noEmit` and `npm run lint`, test it by hand in light and dark mode, and open a PR from `feature/waste/initial-implementation`.

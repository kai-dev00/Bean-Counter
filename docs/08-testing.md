# 08 · Testing

## Current state

> ⚠️ **There are no automated tests.** The repo has no test files (`*.test.*`, `*.spec.*`), no test runner (Jest, Vitest, Playwright…), no `test` npm script and no CI.

What exists today:

| Check | How to run | What it catches |
|---|---|---|
| Type checking | `npx tsc --noEmit` | Type errors across the project. ⚠️ It currently reports errors in `app/dashboard/accessManagement/roles/*` (`Permission.description` is `string \| null` in Prisma but `string` in the local `Permission` type in `RolesManagementForm.tsx`) |
| Linting | `npm run lint` | ESLint (`next/core-web-vitals` + TypeScript rules). ⚠️ There are existing errors, e.g. hooks called conditionally in several `*Client.tsx` / table components, and `no-explicit-any` |
| Manual testing | `npm run dev` | Everything else |

There are no test-like artifacts left (the old `/api/test-edit-user` debug route was deleted).

## Suggested setup

The suggestion below fits the stack, but **none of it is installed yet**.

| Layer | Tool | Why |
|---|---|---|
| Unit | **Vitest** | Fast and TS-native. Good for pure functions (`computeInventoryStatus`, `formatPeso`, permission string building) |
| Component | **Vitest + React Testing Library** (jsdom) | `CustomDropdown`, `DataTable` filtering/pagination, forms |
| Integration (server actions + DB) | **Vitest** against a throwaway Postgres (Docker or a separate `DATABASE_URL`) | Purchase lifecycle, auth flows, permission enforcement |
| End-to-end | **Playwright** | Login → create item → receive purchase, in a real browser |

Suggested layout:

```text
tests/
  unit/            # *.test.ts for lib/ and app/dashboard/utils
  components/      # *.test.tsx with React Testing Library
  integration/     # server actions against a test DB
e2e/               # Playwright specs
```

### Writing a first test (example)

```ts
// tests/unit/inventory-status.test.ts
import { describe, it, expect } from "vitest";
import { computeInventoryStatus } from "@/app/dashboard/utils";

describe("computeInventoryStatus", () => {
  it("is out_of_stock at zero", () => {
    expect(computeInventoryStatus(0, 10)).toBe("out_of_stock");
  });
  it("is warning at or below minimum", () => {
    expect(computeInventoryStatus(10, 10)).toBe("warning");
  });
  it("is low_stock within 1.5× minimum", () => {
    expect(computeInventoryStatus(15, 10)).toBe("low_stock");
  });
  it("keeps discontinued regardless of stock", () => {
    expect(computeInventoryStatus(100, 10, true)).toBe("discontinued");
  });
});
```

To run something like this you'd need to `npm i -D vitest` and add a `vitest.config.ts` with the `@` → project root alias, matching `tsconfig.json` `paths`.

## Coverage gaps (priority order)

| Priority | Area | Why it matters | Code |
|---|---|---|---|
| 1 | **Permission enforcement in server actions** | Most actions don't check permissions today. Tests would catch this and stop it coming back | `app/dashboard/*/actions.ts` |
| 2 | **Auth flows:** login, refresh rotation, logout, inactive users, rate limits | Security-critical, and recently changed | `app/actions/auth.*.ts`, `proxy.ts`, `lib/upstash/ratelimit.ts` |
| 3 | **Purchase lifecycle** | Receiving changes stock and status in one transaction; DRAFT-only rules are enforced in the write itself | `app/dashboard/purchase/actions.ts` |
| 4 | **Inventory status calculation** | Drives restock alerts, dashboard counts and filters | `computeInventoryStatus` |
| 5 | **Invite and password reset** | Token expiry and single use | `actions/users.ts`, `auth.register.ts`, `auth.reset-password.ts` |
| 6 | **Audit log wrappers** | Before/after snapshots on every write | `lib/types/prismaLogger.ts` |
| 7 | **Dashboard aggregates** | Monthly spend buckets, trend %, top suppliers, value by category | `app/dashboard/page.tsx` |
| 8 | **`DataTable` behaviour** | Search, multi-filter, date range, pagination, empty states | `components/DataTable.tsx` |
| 9 | **`CustomDropdown`** | Single/multi select, search, keyboard, portal positioning | `components/CustomDropdown.tsx` |
| 10 | **Seed script** | Role → permission mapping (MODERATOR was wrong before) | `prisma/seed.ts` |

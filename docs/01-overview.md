# 01 · Overview

## What it is

Bean Counter (package name `next-p1`) is an **internal back-office app for a coffee shop**. It replaces spreadsheets for tracking ingredients and supplies, ordering from suppliers, and seeing what needs restocking.

There is no public or customer-facing part. Every page except the auth screens sits behind login under `/dashboard`.

## Who it's for

Users are staff invited by an administrator. What each person can do depends on their **role**. The seed data creates three roles (see [`prisma/data/roles.json`](../prisma/data/roles.json)):

| Role | Intended access (from seed) |
|---|---|
| `ADMIN` | Every permission |
| `MODERATOR` | Inventory, category, supplier and purchase management, dashboard and reports, plus read access to users/roles |
| `USER` | Read-only access to every module |

Admins can create more roles and assign any combination of the 26 permissions in the UI.

## Key features

| Module | What you can do | Main code |
|---|---|---|
| **Dashboard** | KPI cards (inventory value, low-stock count, spend this month vs last month, pending orders), 6-month spend chart, value by category, top 5 suppliers, stock-health donut, "Needs Restocking" list, live activity feed | [`app/dashboard/page.tsx`](../app/dashboard/page.tsx), [`app/dashboard/_dashboard-components/`](../app/dashboard/_dashboard-components) |
| **Inventory** | CRUD for stock items with quantity, unit (pcs/kg/g/l/ml), minimum stock and per-unit price. Status is calculated automatically (in stock / low / warning / out of stock) or set manually to *discontinued*. Includes purchase history per item | [`app/dashboard/inventory/`](../app/dashboard/inventory) |
| **Category** | CRUD for categories with emoji icon and colour; shows total stock value per category | [`app/dashboard/category/`](../app/dashboard/category) |
| **Supplier** | CRUD for supplier contact details | [`app/dashboard/supplier/`](../app/dashboard/supplier) |
| **Purchase** | Purchase orders with line items. Lifecycle: `DRAFT` → `RECEIVED` (adds stock to inventory) or `CANCELLED` | [`app/dashboard/purchase/`](../app/dashboard/purchase) |
| **Reports** | Inventory valuation and received-purchase summaries | [`app/dashboard/reports/`](../app/dashboard/reports) |
| **Access management** | Invite users by email, edit role/active status, delete users or invites; create/edit roles and their permissions | [`app/dashboard/accessManagement/`](../app/dashboard/accessManagement) |
| **Auth** | Login, invite-based registration, forgot/reset password by email, change password on the profile page | [`app/(auth)/`](../app/(auth)), [`app/actions/`](../app/actions) |
| **Audit log** | Every create/update/delete through the logging helpers stores a before/after snapshot in `ActionLog` and is pushed live to the dashboard | [`lib/types/prismaLogger.ts`](../lib/types/prismaLogger.ts) |
| **Export** | Download table data as `.xlsx` | [`app/dashboard/utils/downloadExcel.ts`](../app/dashboard/utils/downloadExcel.ts) |
| **Theme** | Light/dark mode with a toggle in the header | [`app/globals.css`](../app/globals.css), [`components/ThemeToggle.tsx`](../components/ThemeToggle.tsx) |

## Tech stack

Versions are the ones installed in `node_modules`. `package.json` ranges are in brackets where they differ.

| Area | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack in dev) | 16.1.1 |
| UI library | React / React DOM | 19.2.3 |
| Language | TypeScript (`strict`) | 5.9.3 (`^5`) |
| Database | PostgreSQL | not pinned ⚠️ |
| ORM | Prisma + `@prisma/adapter-pg` + `pg` | 7.2.0 / 7.2.0 / 8.16.3 |
| Styling | Tailwind CSS v4 + `tw-animate-css` | 4.1.18 (`^4`) |
| UI primitives | shadcn/ui (style `new-york`) on Radix UI | `radix-ui` 1.4.3 |
| Icons | `lucide-react`, `react-icons` | 0.562.0 / 5.5.0 |
| Charts | Recharts (through shadcn `chart.tsx`) | 2.15.4 |
| Forms | React Hook Form + `@hookform/resolvers` + Zod | 7.70.0 / 5.2.2 / 4.3.5 |
| Auth | `jose` (JWT, HS256), `bcryptjs` (hashing) | 6.1.3 / 3.0.3 |
| Realtime | `@upstash/realtime` on `@upstash/redis` | 1.0.3 / 1.36.3 |
| Email | `nodemailer` (Gmail SMTP) | 7.0.12 |
| Theming | `next-themes` | 0.4.6 |
| Toasts | `sonner` | 2.0.7 |
| Dates | `date-fns`, `react-day-picker` | 4.1.0 / 9.14.0 |
| Excel export | `xlsx` (SheetJS) | 0.18.5 |
| Seed runner | `tsx` | 4.21.0 |
| Linting | ESLint 9 + `eslint-config-next` | 9.39.2 / 16.1.1 |

> ⚠️ **Gaps / TODO**
> - `jsonwebtoken` and `@types/jsonwebtoken` are installed but never imported (JWTs use `jose`). They can be removed.
> - There's no `engines` field, so the Node.js version isn't pinned. Development was done on Node 24.
> - The root [`README.md`](../README.md) is still the `create-next-app` template.

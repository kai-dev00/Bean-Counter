<p align="center">
  <img src="public/brand/bean-counter-mark.svg" alt="Bean Counter logo" width="96" />
</p>

<h1 align="center">Bean Counter</h1>

<p align="center">
  Inventory, purchasing and supplier management for a coffee shop.
</p>

---

Bean Counter is an internal back-office web app. Staff use it to track stock and categories, manage suppliers, and create purchase orders that restock inventory when they're received. A dashboard shows stock health and spending at a glance.

Access is invite-only and controlled by roles and permissions. Every create, update and delete is recorded in an audit log, which feeds a live activity stream on the dashboard and the **System Logs** page.

## Features

| Module | What you can do |
|---|---|
| **Dashboard** | KPI cards (inventory value, low stock, monthly spend, pending orders), 6-month spend chart, value by category, top suppliers, stock-health donut, restock list, live activity feed |
| **Inventory** | Manage stock items with quantity, unit (pcs/kg/g/L/mL), minimum stock and unit price. Status (in stock / low / warning / out of stock) is calculated automatically, or set to *discontinued* |
| **Category** | Group items with an emoji icon and colour; see total stock value per category |
| **Supplier** | Keep supplier contact details |
| **Purchase** | Purchase orders with line items: `DRAFT` → `RECEIVED` (adds the stock to inventory) or `CANCELLED` |
| **Reports** | Inventory valuation and received-purchase summaries |
| **Access Management** | Invite users by email, assign roles, deactivate or remove users; create roles with fine-grained permissions; browse the **System Logs** audit trail with before/after changes |
| **Auth** | Login, invite-based registration, forgot/reset password by email, change password from the profile page |
| **Extras** | Excel (`.xlsx`) export of tables, light/dark theme, installable as a PWA |

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions), React 19, TypeScript
- **Database:** PostgreSQL with [Prisma 7](https://www.prisma.io) (`@prisma/adapter-pg`)
- **UI:** Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com) on Radix UI, Recharts, lucide-react
- **Forms:** React Hook Form + Zod (validated on both client and server)
- **Auth:** JWT access/refresh tokens in HTTP-only cookies (`jose`), bcrypt password hashing
- **Realtime & rate limiting:** [Upstash](https://upstash.com) Redis (`@upstash/realtime`, `@upstash/ratelimit`)
- **Email:** Nodemailer over Gmail SMTP

## Getting started

### Prerequisites

- Node.js (current LTS; developed on Node 24) and npm
- A PostgreSQL database
- An [Upstash Redis](https://console.upstash.com) database (for the live feed and rate limiting)
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) (for invite and reset emails)

### Setup

```bash
git clone https://github.com/kai-dev00/NextJS-Project.git
cd NextJS-Project
npm install
cp .env.example .env        # then fill in the values (see below)

npx prisma migrate dev      # create the database schema
npx prisma db seed          # load roles, permissions and sample data
npm run dev                 # http://localhost:3000
```

### Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | Secret for the 15-minute access token |
| `REFRESH_TOKEN_SECRET` | Secret for the 7-day refresh token (must differ from the access secret) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST credentials |
| `GMAIL_USER` / `GMAIL_PASS` | Gmail account and App Password used to send email |
| `SMTP_USER` | Address shown in the email `From:` header |
| `NEXT_PUBLIC_APP_URL` | Base URL used in invite and password-reset links |

Generate each JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Sample accounts

The seed creates users for every role from [`prisma/data/users.json`](prisma/data/users.json), where you'll find their emails and starter passwords. Change these before any shared or production use.

| Role | Access |
|---|---|
| `ADMIN` | Everything |
| `MODERATOR` | Inventory, category, supplier, purchase, dashboard and reports; read-only users and roles |
| `INVENTORY_CLERK` | Manages inventory and drafts purchases; can't receive, cancel or delete them |
| `USER` | Read-only access to every module |

Admins can create more roles and pick any combination of permissions from the UI.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check the project |
| `npx prisma studio` | Browse the database in the browser |

## Project structure

```
app/
  (auth)/              Login, register, forgot/reset password pages
  actions/             Auth server actions
  api/                 Token refresh and realtime route handlers
  dashboard/           Every module (inventory, category, supplier, purchase,
                       reports, accessManagement, profile), each with its own
                       page, components and actions
components/            Shared UI (DataTable, modals, inputs) and shadcn/ui primitives
lib/                   Auth, permissions, Prisma client, audit logging, email, Upstash
prisma/                Schema, migrations, seed script and seed data
docs/                  Full developer documentation
proxy.ts               Protects /dashboard and refreshes expired sessions
```

## Documentation

Detailed docs live in [`docs/`](docs/README.md):

[Overview](docs/01-overview.md) ·
[Getting started](docs/02-getting-started.md) ·
[Architecture](docs/03-architecture.md) ·
[Backend](docs/04-backend.md) ·
[Frontend](docs/05-frontend.md) ·
[Database](docs/06-database.md) ·
[Auth & security](docs/07-auth-and-security.md) ·
[Testing](docs/08-testing.md) ·
[Deployment](docs/09-deployment.md) ·
[Conventions](docs/10-conventions.md) ·
[Troubleshooting](docs/11-troubleshooting.md) ·
[Roadmap & known issues](docs/12-roadmap-and-known-issues.md) ·
[Brand](docs/13-brand.md)

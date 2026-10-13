# Bean Counter: Developer Documentation

**Bean Counter** is an internal inventory management web app for a coffee shop. Staff use it to track stock items and categories, manage suppliers, create purchase orders that restock inventory when received, and see a dashboard of stock health and spending. Access is invite-only and controlled by roles and permissions, and every create/update/delete is written to an audit log that also appears as a live activity feed. It is a single Next.js 16 (App Router) application. It uses React Server Components and **server actions** instead of a REST API, and Prisma 7 on PostgreSQL for data.

## Contents

| # | Document | What's inside |
|---|---|---|
| 01 | [Overview](./01-overview.md) | What the app does, who uses it, features, tech stack |
| 02 | [Getting started](./02-getting-started.md) | Prerequisites, install, environment variables, running locally |
| 03 | [Architecture](./03-architecture.md) | System diagram, folder structure, request/data flow, design decisions |
| 04 | [Backend](./04-backend.md) | Route handlers, every server action, business rules, integrations |
| 05 | [Frontend](./05-frontend.md) | Pages, shared components, forms, theming, accessibility |
| 06 | [Database](./06-database.md) | ER diagram, models, enums, migrations, seed data |
| 07 | [Auth & security](./07-auth-and-security.md) | Login/refresh flows, roles & permissions, security findings |
| 08 | [Testing](./08-testing.md) | Current state (no tests), suggested setup, coverage gaps |
| 09 | [Deployment](./09-deployment.md) | Build process, environment config, deploy checklist |
| 10 | [Conventions](./10-conventions.md) | Code style, naming, git workflow, adding a new module |
| 11 | [Troubleshooting](./11-troubleshooting.md) | Common errors and how to fix them |
| 12 | [Roadmap & known issues](./12-roadmap-and-known-issues.md) | Open TODOs, bugs, limitations, suggested improvements |
| 13 | [Brand](./13-brand.md) | Logo files, colours, usage rules |

## Quick start

```bash
npm install
cp .env.example .env          # then fill in the values (see 02-getting-started.md)
npx prisma migrate dev        # create the schema
npx prisma db seed            # load roles, permissions, sample data
npm run dev                   # http://localhost:3000
```

> ⚠️ **Read [07 – Auth & security](./07-auth-and-security.md#security-findings) before deploying.** A few security findings are still open.

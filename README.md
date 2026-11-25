
<div align="center">

![ArcticEye — Inventory Management System](docs/banner.svg)

**A full-stack, role-based inventory and point-of-sale web application.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![tRPC](https://img.shields.io/badge/tRPC-v11-2596BE?logo=trpc&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=drizzle&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
![Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)

[Features](#features) · [Quick start](#quick-start) · [Architecture](#architecture) · [Data model](#data-model) · [Roles](#roles-and-permissions) · [API](#api-reference) · [Deployment](#build-and-deployment)

</div>

---

## Overview

ArcticEye is a modern web rewrite of a Java Swing + Maven + MySQL desktop inventory application. It keeps the original `categories`, `products` and `stock_movements` schema and sample data, and adds a responsive dashboard, a point-of-sale screen, a full stock-movement audit trail, and secure email/password accounts with three permission levels.

The whole stack is TypeScript. tRPC gives the frontend end-to-end type safety against the server, so a change to an API procedure is caught at compile time in the React code that calls it.

## Features

| | |
| --- | --- |
| **Dashboard** | Stock metrics, sales trend, stock-by-category charts, restock list and recent activity |
| **Products** | Search, add, edit and delete products with SKU, supplier, reorder level and Indian Rupee (₹) pricing |
| **Categories** | Full CRUD with relationship-safe deletion — a category in use cannot be removed |
| **Warehouse** | Stock totals, available products, reorder alerts and a full stock table |
| **Point of sale** | Product selection, quantity validation, invoice total and automatic stock deduction |
| **Movements** | Audit trail of every stock IN / OUT / ADJUSTMENT, with the user who made it |
| **Accounts** | Email + password sign-in, profile editing, password change, admin user management |
| **Security** | scrypt password hashing, signed JWT in httpOnly cookies, rate-limited auth, server-side role checks |

## Quick start

### Prerequisites

- **Node.js** 20 or later
- **pnpm** (`npm install -g pnpm`)
- A running **MySQL** 8 server and an empty database

### 1. Configure the environment

From the project root:

```powershell
Copy-Item .env.example .env     # Windows PowerShell
# cp .env.example .env          # macOS / Linux
```

Edit `.env` and set:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL connection string, e.g. `mysql://root:password@localhost:3306/inventory` |
| `JWT_SECRET` | Yes in production | Long random string used to sign session tokens |

> [!IMPORTANT]
> Keep `.env` in the project root, next to `package.json` — not inside `drizzle/`.

### 2. Install, migrate and run

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Open **http://localhost:3000/inventory-management**. You'll land on the **Sign in** page — click **Create an account**. The first account registered becomes the **Admin**.

> [!TIP]
> Always start the app with `pnpm dev`, not `pnpm exec tsx watch server/_core/index.ts`. The script uses `cross-env`, so it works the same in Windows PowerShell, macOS and Linux.

<details>
<summary><b>Troubleshooting</b></summary>

- **`mysql is not recognized`** — this only means the MySQL command-line client is not on your Windows `PATH`. You don't need it: if `pnpm db:migrate` succeeded, the app can reach your database.
- **Existing data** — migrations are non-destructive. The seed uses `INSERT IGNORE`, so sample categories and products are only added when their names or SKUs are missing.
- **Upgrading from the pre-auth version** — run `pnpm db:migrate` to apply `0003_auth_and_roles`, which adds the user columns without touching existing records.

</details>

## Architecture

![System architecture](docs/architecture.svg)

In production a single Node.js process serves both the tRPC API (at `/api/trpc`) and the built React app. In development, Vite runs as middleware inside Express for hot module reloading.

| Layer | Location | Responsibility |
| --- | --- | --- |
| Presentation | `client/src` | Routing and guards, pages, UI components, query cache |
| API contract | tRPC | Typed procedures, Zod validation, superjson serialization |
| Application | `server/routers.ts`, `server/_core/trpc.ts` | `auth`, `users` and `inventory` routers; role middleware |
| Domain / data | `server/db.ts` | Queries, business rules, transactions |
| Persistence | `drizzle/` | Schema and SQL migrations |
| Cross-cutting | `server/auth.ts`, `server/_core/*` | Hashing, sessions, rate limiting, env, cookies, Vite |

### Request lifecycle

![Request lifecycle](docs/request-lifecycle.svg)

### Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Wouter, TanStack Query, Tailwind CSS, Radix UI / shadcn |
| API | tRPC v11, Zod, superjson |
| Server | Node.js, Express |
| ORM / database | Drizzle ORM, MySQL, drizzle-kit migrations |
| Security | scrypt hashing, JWT (HS256 via `jose`), httpOnly cookies |
| Tooling | pnpm, Vite, esbuild, Vitest, TypeScript, Docker |

## Data model

![Data model](docs/data-model.svg)

**Integrity rules**

- **POS sale** runs in a single database transaction: it checks available stock, decrements the quantity and writes an `OUT` movement. Over-selling and invalid quantities are rejected.
- **Category deletion** is blocked while any product still references the category.
- **User deletion** sets `stock_movements.user_id` to `NULL`, so the audit trail is never lost.

## Roles and permissions

![Roles and permissions](docs/roles.svg)

| Aspect | Design |
| --- | --- |
| Credentials | Email + password, stored as `scrypt$salt$hash` |
| Session | JWT signed with `JWT_SECRET`, 7-day expiry, httpOnly cookie |
| Abuse control | Sign-in and sign-up limited to 8 attempts per 15 minutes |
| First user | The first registered account becomes Admin |
| Enforcement | tRPC middleware on the server; the UI only hides actions a user can't perform |

## Application routes

| Route | Page | Access |
| --- | --- | --- |
| `/login`, `/signup` | Sign in / create account | Guests only (signed-in users are redirected) |
| `/inventory-management` (alias `/`) | Dashboard | Signed in |
| `/products` | Product management | Signed in · edit: Manager |
| `/categories` | Category management | Signed in · edit: Manager |
| `/warehouse` | Stock overview and reorder alerts | Signed in |
| `/pos` | Point of sale | Signed in |
| `/movements` | Stock movement audit trail | Signed in · record: Manager |
| `/administration` | Application, platform and database info | Signed in |
| `/profile` | Edit name, change password | Signed in |
| `/users` | User management | Admin |

## API reference

All procedures are served under `/api/trpc`.

| Router | Procedures | Minimum role |
| --- | --- | --- |
| `auth` | `me`, `register`, `login`, `logout` | Public |
| `auth` | `updateProfile`, `changePassword` | Signed in |
| `inventory` | `dashboard`, `insights`, `warehouse`, `products`, `product`, `categories`, `movements`, `createSale` | Signed in |
| `inventory` | `saveProduct`, `deleteProduct`, `addCategory`, `updateCategory`, `deleteCategory`, `adjustStock` | Manager |
| `users` | `list`, `update` | Admin |

## Project structure

```text
.
├── client/src/        React app — pages, components/ui, hooks, lib/trpc.ts
├── server/
│   ├── _core/         Express bootstrap, tRPC setup, context, env, Vite
│   ├── routers.ts     API definition (auth, users, inventory)
│   ├── auth.ts        Password hashing, JWT sessions, rate limiting
│   └── db.ts          Data access and transactions
├── drizzle/           schema.ts and migrations 0000–0003
├── shared/            Constants and types shared by client and server
├── docs/images/       README diagrams
├── Dockerfile
├── vite.config.ts
└── drizzle.config.ts
```

## Build and deployment

| Stage | Command | Result |
| --- | --- | --- |
| Develop | `pnpm dev` | `tsx watch` server with Vite HMR |
| Migrate | `pnpm db:migrate` | Applies migrations; non-destructive seed |
| Type-check | `pnpm check` | TypeScript compile check |
| Test | `pnpm test` | Vitest suite |
| Build | `pnpm build` | Vite client build + esbuild server bundle into `dist/` |
| Run | `pnpm start` | `node dist/index.js` serves the API and the SPA |

A `Dockerfile` is included for container builds. In production, set `NODE_ENV=production` and a strong `JWT_SECRET`, which is mandatory in production.

## Roadmap

- [ ] Remove unused scaffolding (`llm.ts`, `imageGeneration.ts`, `map.ts`, `oauth.ts`, `voiceTranscription.ts`, `AIChatBox`, `Map`)
- [ ] Move the rate limiter to a shared store (e.g. Redis) so it survives restarts and works across instances
- [ ] Split `InventoryApp.tsx` into per-page components
- [ ] Reformat `db.ts` with `pnpm format`

## Acknowledgements

Migrated from the original Java Swing + Maven + MySQL Inventory Management project, keeping its schema and sample data.


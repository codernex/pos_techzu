# Multi-Outlet Point-of-Sale (POS) & Central HQ System

A fullstack enterprise Point-of-Sale (POS) and Central HQ Management platform built within a **Turborepo** monorepo using **Express.js**, **Prisma 7**, **PostgreSQL 16**, **React 19**, **Vite**, and **Tailwind CSS v4**.

Designed and implemented in accordance with the requirements in [Task](https://docs.google.com/document/d/1V4_w1xME1TQYfY8yCarXFyD1P8YXO1kulTnZKQo1Rt0/edit).

---

## Key Features

1. **Central HQ Management**:
   - Master Menu catalog (SKU, name, category, default base prices).
   - Assign menu items to specific outlets.
   - Override prices per outlet (for example, airport premium pricing) with automatic fallback to the base price.
   - Central sales reports: Total gross revenue per outlet and top 5 selling items.

2. **Outlet POS Terminal & Operations**:
   - Scoped menu view: Terminals see only the items assigned to their specific outlet.
   - Interactive cashier POS terminal with live cart calculations and payment methods (Cash, Card, QRIS/Mobile Pay).
   - Instant digital thermal receipt generation.
   - Real-time stock tracking with low-stock warnings (< 5 units) and quick restock buttons.

3. **Data Integrity & Concurrency Control**:
   - **Atomic Receipt Sequences**: Uses PostgreSQL row-locking (`SELECT ... FOR UPDATE`) inside transactions to guarantee gapless, collision-free receipts per outlet (`RCP-{OUTLET}-{YYYYMMDD}-{000001}`).
   - **Negative Stock Prevention**: An engine-level check constraint (`CHECK (quantity >= 0)`) combined with atomic update queries prevents overselling during simultaneous checkout bursts.
   - Full ACID transaction rollback on any failure.

---

## Architecture & System Design
- For the full system design document—including the ERD diagram, 100k txns/month scaling plan, microservices evolution, and offline POS/KDS strategy—see [Architecture.md](Architecture.md).

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | Turborepo, pnpm workspaces |
| **Backend** | Node.js 24, Express.js, TypeScript |
| **ORM & Database** | Prisma 7 (with `@prisma/adapter-pg` driver and `prisma.config.ts`), PostgreSQL 16 |
| **Frontend** | React 19, Redux Toolkit & RTK Query, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide Icons |
| **Validation** | Zod schema validation middleware |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## Local Development Setup

Follow these steps to run the entire Techzu POS & Central HQ system locally on your machine.

### Prerequisites

| Requirement | Minimum Version | Installation |
| :--- | :--- | :--- |
| **Node.js** | `>= 24.0.0` | `nvm install 24 && nvm use 24` |
| **pnpm** | `>= 10.0.0` | `npm install -g pnpm` |
| **Docker & Docker Compose** | Any modern version | [docker.com](https://www.docker.com/) |

---

### Step-by-Step Setup Guide

#### 1. Clone & Install Dependencies

Clone the monorepo and install all workspace packages:

```bash
git clone https://github.com/codernex/pos_techzu
cd pos_techzu
pnpm install
```

#### 2. Configure Environment Variables

The project uses a **single canonical `.env` file at the repository root**. Copy the template:

```bash
cp .env.example .env
```

The default values in `.env` are preconfigured for instant local development:
* **PostgreSQL Port**: `5433` (selected to avoid collisions with any existing local PostgreSQL running on `5432`).
* **Backend API Port**: `5006`
* **Admin Frontend Port**: `3004`
* **Vite API Base URL**: `http://localhost:5006/api/v1`

#### 3. Start PostgreSQL with Docker

Start the PostgreSQL 16 container in the background:

```bash
docker compose up -d postgres
```

> Check container health:
> ```bash
> docker ps --filter "name=pos_postgres"
> ```
> Wait until `STATUS` shows `healthy` (usually 3-5 seconds).

#### 4. Apply Database Migrations & Integrity Constraints

Run Prisma migrations to create all database tables and apply the engine-level non-negative stock constraint:

```bash
# Apply Prisma migrations (creates tables & non-negative inventory constraint)
pnpm db:migrate:deploy
```

> **For Development**: To author and apply a new migration during feature development:
> ```bash
> pnpm db:migrate --name your_migration_name
> ```

#### 5. Seed Demo Data (Bangladeshi Outlets & BDT Currency)

Seed the database with sample company, Bangladeshi outlets, menu categories, master menu items, stock, price overrides, and sample sales:

```bash
pnpm db:seed
```

> **Seeded Outlets**:
> * `GLS` - Gulshan-2 Flagship (Dhaka)
> * `DHN` - Dhanmondi Branch (Dhaka)
> * `UTR` - Uttara Hub (Dhaka)
>
> **Currency**: Bangladeshi Taka (`৳` BDT).

#### 6. Run the Concurrency & Integrity Test Suite

Verify that atomic row-locking generates sequential, collision-free receipts and prevents negative-stock overselling under simultaneous bursts:

```bash
pnpm --filter backend run test:concurrency
```

Expected output:
```
✔ PASS: All receipt numbers are unique, strictly sequential, and collision-free!
✔ PASS: System safely prevented negative stock! Zero oversells, exact zero inventory remainder.
ALL CONCURRENCY & INTEGRITY VERIFICATIONS PASSED 100%!
```

---

### Starting the Application

You can run the development servers using any of the following methods:

#### Method A: Turborepo Monorepo Mode (Recommended)

Run both the backend API and the admin frontend concurrently from the root directory:

```bash
pnpm dev
```

#### Method B: Independent Service Terminals

If you prefer dedicated terminal logs for each service:

```bash
# Terminal 1: Start Express + Prisma Backend
pnpm --filter backend run dev

# Terminal 2: Start Vite + Tailwind v4 Admin & POS Terminal
pnpm --filter admin run dev
```

#### Method C: Full Stack Docker Compose Mode

Run the entire stack (PostgreSQL, Backend API, and Nginx-served Admin) containerized:

```bash
docker compose up --build
```

---

### Local Service Map & Access Endpoints

| Service | Local URL | Port | Notes |
| :--- | :--- | :--- | :--- |
| **Admin & POS UI** | [http://localhost:3004](http://localhost:3004) | `3004` | Vite dev server with React Compiler & RTK Query |
| **Backend REST API** | [http://localhost:5006/api/v1](http://localhost:5006/api/v1) | `5006` | Express 5 with Prisma 7 |
| **API Health Check** | [http://localhost:5006/health](http://localhost:5006/health) | `5006` | Returns `{ status: "ok", timestamp: ... }` |
| **PostgreSQL Database** | `localhost:5433` | `5433` | User: `postgres`, Password: `postgrespassword`, DB: `pos_db` |
| **Prisma Studio (GUI)** | [http://localhost:5555](http://localhost:5555) | `5555` | Run `pnpm --filter backend exec prisma studio` |

---

### Useful Development Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start all monorepo applications in watch mode via Turborepo |
| `pnpm build` | Compile backend and build production bundle for frontend |
| `pnpm db:migrate` | Generate & apply Prisma migrations in development (`prisma migrate dev`) |
| `pnpm db:migrate:deploy` | Apply pending production migrations (`prisma migrate deploy`) |
| `pnpm db:seed` | Seed database with Bangladeshi outlets and BDT catalog |
| `pnpm --filter backend run migrate:create` | Create a new Prisma migration without applying it immediately (`--create-only`) |
| `pnpm --filter backend run migrate:status` | Check applied and pending migration status |
| `pnpm --filter backend exec prisma studio` | Open visual database browser in web UI |
| `pnpm --filter backend run test:concurrency` | Execute high-concurrency race condition test suite |
| `docker compose down` | Stop local Docker services |
| `docker compose down -v` | Stop local Docker services and reset database volumes |

---

### Troubleshooting

* **Port Conflict on 5432**: If your host machine already runs PostgreSQL on port 5432, `docker-compose.yaml` maps the container to **port 5433** (`localhost:5433`). If you need to change it, edit `POSTGRES_PORT` in your root `.env`.
* **Resetting Database Cleanly**:
  ```bash
  docker compose down -v
  docker compose up -d postgres
  pnpm db:migrate:deploy
  pnpm db:seed
  ```

---

## API Endpoints Reference (`/api/v1`)

### Outlets
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/outlets` | List all outlets |
| `GET` | `/api/v1/outlets/:id` | Get outlet details |
| `POST` | `/api/v1/outlets` | Create new outlet |
| `PATCH` | `/api/v1/outlets/:id` | Update outlet |

### Master Menu & Categories (HQ)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/menu/categories` | List all categories |
| `POST` | `/api/v1/menu/categories` | Create category |
| `GET` | `/api/v1/menu/items` | List master menu items (query: `categoryId`, `search`) |
| `GET` | `/api/v1/menu/items/:id` | Get master menu item |
| `POST` | `/api/v1/menu/items` | Create master menu item |
| `PATCH` | `/api/v1/menu/items/:id` | Update master menu item |
| `DELETE` | `/api/v1/menu/items/:id` | Delete master menu item |

### Outlet Menu Assignment & Overrides
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/assignments/:outletId/menu` | Retrieve menu items assigned to outlet (effective price & live stock) |
| `POST` | `/api/v1/assignments/:outletId/menu` | Assign item to outlet |
| `PATCH` | `/api/v1/assignments/:outletId/menu/:menuItemId/price` | Override menu price for outlet |
| `DELETE` | `/api/v1/assignments/:outletId/menu/:menuItemId` | Unassign item from outlet |

### Inventory (Outlet Stock)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/inventory/:outletId/inventory` | View outlet inventory (query: `lowStockOnly`, `search`) |
| `PUT` | `/api/v1/inventory/:outletId/inventory/:menuItemId` | Set exact stock quantity |
| `POST` | `/api/v1/inventory/:outletId/inventory/:menuItemId/restock` | Restock (increment stock) |

### Sales & Checkout (POS)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/sales/:outletId/sales` | Process sale transaction (ACID transaction, sequential receipt, stock deduction) |
| `GET` | `/api/v1/sales/:outletId/sales` | List completed sales for outlet |
| `GET` | `/api/v1/sales/detail/:id` | Get sale transaction details |
| `GET` | `/api/v1/sales/receipt/:receiptNumber` | Look up sale by receipt number |

### Reporting & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/reports/revenue-by-outlet` | Total revenue aggregated by outlet |
| `GET` | `/api/v1/reports/top-items/:outletId` | Top 5 selling items for specific outlet |
| `GET` | `/api/v1/reports/overview` | Global HQ analytics overview (KPIs, revenue breakdown, top items) |

---

## Backend Layered Architecture

```
apps/backend/src/
├── config/
│   ├── env.ts             # Zod-validated environment variables
│   └── prisma.ts          # Prisma 7 client with @prisma/adapter-pg
├── errors/
│   └── AppError.ts        # Domain error hierarchy
├── middlewares/
│   ├── errorHandler.ts    # Centralized HTTP error handler
│   └── validate.ts        # Zod request validation middleware
├── repositories/
│   ├── outlet.repository.ts
│   ├── menu.repository.ts
│   ├── assignment.repository.ts
│   ├── inventory.repository.ts
│   ├── sale.repository.ts # Atomic sequential counter & stock deduction
│   └── report.repository.ts # Performant SQL aggregations
├── services/
│   ├── outlet.service.ts
│   ├── menu.service.ts
│   ├── assignment.service.ts
│   ├── inventory.service.ts
│   ├── sale.service.ts
│   └── report.service.ts
├── controllers/
│   ├── outlet.controller.ts
│   ├── menu.controller.ts
│   ├── assignment.controller.ts
│   ├── inventory.controller.ts
│   ├── sale.controller.ts
│   └── report.controller.ts
├── validations/
│   └── index.ts           # Zod schemas for all endpoints
├── routes/
│   ├── outlet.routes.ts
│   ├── menu.routes.ts
│   ├── assignment.routes.ts
│   ├── inventory.routes.ts
│   ├── sale.routes.ts
│   ├── report.routes.ts
│   └── index.ts
├── app.ts                 # Express application setup & middleware
└── server.ts              # Server lifecycle & graceful shutdown
```

---

## CI/CD Pipeline: DigitalOcean Droplet Deployment

The project includes an automated GitHub Actions CI/CD workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds, tests, and deploys the entire stack to a DigitalOcean Droplet upon push to `main`.

### 1. Droplet Prerequisites
- Ubuntu 22.04 / 24.04 Droplet with Docker & Docker Compose installed:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
  ```
- Add your SSH public key to `~/.ssh/authorized_keys` on the droplet.

### 2. GitHub Actions Secrets
The deployment pipeline uses these secrets under **Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions**:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `DO_HOST` | DigitalOcean Droplet public IP | `159.65.120.45` |
| `DO_USER` | SSH username (default: `root`) | `root` |
| `DO_SSH_PRIVATE_KEY` | Private SSH key matching `authorized_keys` | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DO_SSH_PORT` | SSH port (default: `22`) | `22` |
| `DO_APP_DIR` | Target folder on the droplet | `/var/www/pos_techzu` |

### 3. Production Domains & DNS Setup
Ensure the following DNS **A-Records** point to your Droplet IP:
* `pos-techzu.codernex.dev` $\rightarrow$ `<DROPLET_IP>` (Admin & POS Frontend)
* `api-pos-techzu.codernex.dev` $\rightarrow$ `<DROPLET_IP>` (Backend REST API)

### 4. How Deployment & Nginx Automation Works
1. **CI**: Verifies the TypeScript compilation and builds both backend and frontend applications.
2. **Transfer via SCP**: Uses `appleboy/scp-action` to copy project files directly to the droplet.
3. **Containers**: Builds and starts Docker containers (`docker compose up -d --build`).
4. **Migrations & Seed**: Waits for PostgreSQL to be healthy, then runs `prisma migrate deploy` and `prisma db seed` inside the backend container.
5. **Health Check**: Verifies that `http://localhost:5006/health` returns HTTP 200.
6. **Host Nginx & SSL Automation** ([`deploy/scripts/setup-nginx.sh`](deploy/scripts/setup-nginx.sh)):
   - Copies site configuration to `/etc/nginx/sites-available/pos-techzu.conf`.
   - Validates Nginx syntax (`nginx -t`).
   - Automatically provisions/renews Let's Encrypt SSL certificates with Certbot.
   - Reloads Nginx with zero downtime.
7. **Cleanup**: Cleans up dangling Docker images to preserve droplet disk space.

---

## License & Author

Created for Techzu Technical Assessment. All rights reserved.

<p align="center">
  <img src="station-tracker/public/skyco-logo.svg" alt="Skyco Shading Systems" width="280" />
</p>

# Skyco Station Tracker

Production order tracking system for **Skyco Shading Systems**. Replaces a Google Sheets workflow with a real-time, touchscreen-optimized web app designed for factory floor tablets.

Orders flow through 7 manufacturing stations — from intake to shipment — with live status updates, priority sorting, and a drag-and-drop Kanban board.

---

## Stations

| # | Station | Purpose |
|---|---------|---------|
| 1 | **Basket** | Orders cleared for production |
| 2 | **Fabric Cut** | Fabric cutting operations |
| 3 | **Extrusions** | Metal cutting coordination |
| 4 | **Welding** | Welding operations |
| 5 | **Assembly** | Assembly operations |
| 6 | **Packing** | Boxing and prep |
| 7 | **Will Call** | Completed, awaiting shipment |

Each order has three independent status flags per station:

- **Done** — work complete
- **Hold** — order paused
- **Missing** — parts or materials missing

---

## Features

- **Dashboard** — grid overview of all stations with live order counts
- **Kanban board** — drag-and-drop orders across stations
- **Station touchscreen view** — optimized for tablets (64px+ touch targets, dark theme, auto-fade completed orders)
- **Real-time updates** — Server-Sent Events push changes to all connected clients instantly
- **Google Sheets import** — OAuth2 flow to pull orders from an existing spreadsheet
- **Admin panel** — order CRUD, station config, reports, calculation tools (extrusion & fabric)
- **Priority sorting** — rush orders surface to top, then sorted by ship date
- **Audit logging** — every status change is recorded with timestamp
- **Dark / light theme** — toggle per user preference

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4, Lucide icons |
| Drag & drop | @dnd-kit |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| Real-time | Server-Sent Events (SSE) |
| Sheets sync | Google APIs (googleapis) |

---

## Prerequisites

You only need **one** of the following paths:

| Path | What to install |
|------|----------------|
| **Docker (recommended)** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) — available for Windows, macOS, and Linux. Includes everything you need. |
| **Native install** | Node.js v20+, npm, and a PostgreSQL 16 database |

---

## One-Command Setup

Setup scripts handle everything — prerequisites check, `.env` creation, dependency install, database migration, and station seeding. They prompt you to choose Docker or native mode.

### macOS / Linux

```bash
cd station-tracker
./scripts/setup.sh
```

### Windows (PowerShell)

```powershell
cd station-tracker
.\scripts\setup.ps1
```

Both scripts will:
1. Ask you to choose **Docker** or **Native** mode
2. Create `.env` with a random Postgres password
3. Install dependencies / pull images
4. Start Postgres and run migrations
5. Seed the 7 default stations

After setup, start the app anytime:

```bash
# macOS / Linux
./scripts/start.sh          # auto-detects docker vs native
./scripts/start.sh docker   # force Docker mode
./scripts/start.sh dev      # force native dev server
./scripts/start.sh prod     # native production build + start
```

```powershell
# Windows
.\scripts\start.ps1          # auto-detects
.\scripts\start.ps1 docker
.\scripts\start.ps1 dev
.\scripts\start.ps1 prod
```

---

## Manual Setup

If you prefer to run the steps yourself instead of using the scripts above.

### Prerequisites

| Path | What to install |
|------|----------------|
| **Docker (recommended)** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) — Windows, macOS, and Linux. Includes everything. |
| **Native** | Node.js v20+, npm, and PostgreSQL 16 |

### Install Docker

**Windows:**

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) — requires Windows 10/11 64-bit with WSL 2.
2. Enable the **WSL 2 backend** when prompted.
3. After install, open Docker Desktop and wait for the engine to start.
4. Verify in PowerShell:

```powershell
docker --version
docker compose version
```

**macOS:**

1. Install [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) (Apple Silicon and Intel).
2. Verify in Terminal:

```bash
docker --version
docker compose version
```

### Quick Start with Docker

Works identically on **Windows (PowerShell)** and **macOS / Linux (Terminal)**.

```bash
cd station-tracker

# 1. Create your env file
cp .env.example .env
#    → open .env and set POSTGRES_PASSWORD to something secure
```

> **Windows note:** use `copy .env.example .env` if `cp` is not recognized.

```bash
# 2. Start Postgres + app (first run pulls images and builds — a few minutes)
docker compose up -d

# 3. Run migrations & seed stations (first time only)
docker compose run --rm migrate
```

The app is now running at **http://localhost:3000**.

### Common Docker commands

| Command | What it does |
|---------|-------------|
| `docker compose up -d` | Start all services in the background |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop and **delete the database volume** |
| `docker compose up -d --build` | Rebuild after code changes |
| `docker compose logs -f app` | Tail app logs |
| `docker compose logs -f db` | Tail Postgres logs |
| `docker compose up -d db` | Start **only** Postgres (for local dev) |

### Native Install (without Docker)

Install the runtime and database natively if Docker is not an option.

**Windows:**
- [Node.js v20 LTS](https://nodejs.org/) — the .msi installer includes npm.
- [PostgreSQL 16](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) — note the user/password you set.

**macOS:**
- Node.js v20+ via [nvm](https://github.com/nvm-sh/nvm) or the [installer](https://nodejs.org/).
- Postgres via Homebrew: `brew install postgresql@16 && brew services start postgresql@16`

Then:

```bash
cd station-tracker
npm install
```

Create `station-tracker/.env`:

```env
# Windows (adjust user/password to match your Postgres install):
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/station_tracker

# macOS (Homebrew default — no password):
# DATABASE_URL=postgresql://localhost:5432/station_tracker

# Optional — Google Sheets integration
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
```

Create the database and run migrations:

```bash
# macOS / Linux
createdb station_tracker

# Windows (pgAdmin SQL query or psql):
# CREATE DATABASE station_tracker;

# Migrate and seed
npx prisma migrate deploy
npx tsx scripts/seed-stations-only.ts
```

Run the app:

```bash
# Development (http://localhost:3000)
npm run dev

# Production build + start
npm run build
npm start
```

---

## Scripts

### Setup & start (bash + PowerShell)

| Script | Description |
|--------|-------------|
| `./scripts/setup.sh` | One-command setup — macOS / Linux |
| `.\scripts\setup.ps1` | One-command setup — Windows PowerShell |
| `./scripts/start.sh [mode]` | Start the app — macOS / Linux |
| `.\scripts\start.ps1 [mode]` | Start the app — Windows PowerShell |

Start modes: `auto` (default), `docker`, `dev`, `prod`

### npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsx scripts/seed-stations-only.ts` | Seed stations (safe to re-run) |
| `npx prisma db seed` | Seed with sample orders (dev only) |

---

## Project Structure

```
station-tracker/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration history
│   └── seed.ts                # Dev seed data
├── scripts/
│   ├── setup.sh               # One-command setup (macOS/Linux)
│   ├── setup.ps1              # One-command setup (Windows)
│   ├── start.sh               # Start app (macOS/Linux)
│   ├── start.ps1              # Start app (Windows)
│   └── seed-stations-only.ts  # Seed default stations
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── station/[stationId]/  # Touchscreen station view
│   │   ├── order/[orderId]/      # Order detail
│   │   ├── admin/                # Admin panel
│   │   │   ├── stations/         # Station management
│   │   │   ├── sheets/           # Google Sheets config
│   │   │   ├── tools/            # Extrusion & fabric calculators
│   │   │   └── reports/          # Order reports
│   │   └── api/                  # API routes
│   │       ├── orders/           # Order CRUD + status toggle
│   │       ├── stations/         # Station data + kanban
│   │       ├── google/           # Sheets OAuth & sync
│   │       ├── events/           # SSE endpoint
│   │       └── tools/            # Calculation APIs
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks (useStationOrders, useKanbanOrders, etc.)
│   └── lib/                   # Utilities (db client, queries, SSE broadcaster, types)
├── public/                    # Static assets
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # App + Postgres containers
├── .env.example               # Environment variable template
└── package.json
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orders` | List orders (with filters) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/[id]` | Get order detail |
| PATCH | `/api/orders/[id]` | Update order |
| DELETE | `/api/orders/[id]` | Soft-delete order |
| POST | `/api/orders/[id]/status` | Toggle done/hold/missing for a station |
| GET | `/api/stations` | List stations |
| GET | `/api/stations/[id]` | Station orders |
| GET | `/api/stations/kanban` | Kanban board data |
| GET | `/api/events` | SSE stream (real-time updates) |
| GET | `/api/google/auth` | Start Google OAuth flow |
| GET | `/api/google/callback` | OAuth callback |
| POST | `/api/google/import` | Import orders from sheet |

---

## Database Schema

Five tables managed by Prisma:

- **stations** — station config (label, sort order, active flag)
- **orders** — order records (order number, customer, station, rush flag, ship date, notes)
- **order_station_status** — per-order, per-station status (done, hold, missing)
- **audit_log** — change history for every status modification
- **settings** — key-value app settings (Google Sheets config, etc.)

View or edit the schema: `station-tracker/prisma/schema.prisma`

---

## Deployment

### Option 1: Docker on a Windows or Linux server (recommended for self-hosting)

This is the simplest production setup. Install Docker on the server, clone the repo, and run.

**Windows Server / Windows desktop:**

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) (or Docker Engine if using Windows Server with Hyper-V).
2. Clone the repo and `cd station-tracker`.
3. Create `.env` from `.env.example` — set a strong `POSTGRES_PASSWORD`.
4. Run:

```powershell
docker compose up -d
docker compose run --rm migrate
```

5. Open `http://localhost:3000` (or `http://<server-ip>:3000` from other machines on the network).

**Linux server:**

```bash
# Install Docker (if not already)
curl -fsSL https://get.docker.com | sh

cd station-tracker
cp .env.example .env
# edit .env — set POSTGRES_PASSWORD

docker compose up -d
docker compose run --rm migrate
```

> To run on a different port, set `PORT=8080` in `.env` — the app will be available on that port.

> To keep the app running after reboot, Docker's `restart: unless-stopped` policy (already set in `docker-compose.yml`) handles this automatically as long as Docker Desktop / Docker Engine is set to start on boot.

### Option 2: Standalone Docker image (BYO Postgres)

Build the image and run it against any existing Postgres instance:

```bash
cd station-tracker

# Build
docker build -t skyco-station-tracker \
  --build-arg DATABASE_URL=postgresql://user:pass@host:5432/db .

# Run
docker run -d -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  --restart unless-stopped \
  skyco-station-tracker
```

### Option 3: Vercel (cloud)

1. Set `DATABASE_URL` (and optional Google env vars) in your Vercel project settings
2. Build runs `prisma generate && next build` automatically
3. Run migrations against production DB: `npx prisma migrate deploy`
4. Seed stations: `npx tsx scripts/seed-stations-only.ts`

### Option 4: Native Node.js on Windows (no Docker)

If Docker is not an option, you can run the app directly on Windows:

1. Install [Node.js v20 LTS](https://nodejs.org/) and [PostgreSQL 16](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
2. Create a database called `station_tracker` in pgAdmin or psql.
3. Clone the repo, `cd station-tracker`, then:

```powershell
npm install
# Create .env with your DATABASE_URL (see Environment variables section above)
npx prisma migrate deploy
npx tsx scripts/seed-stations-only.ts
npm run build
npm start
```

4. The app runs on `http://localhost:3000`.

> To keep the app running as a background service on Windows, use [PM2](https://pm2.keymetrics.io/): `npm install -g pm2`, then `pm2 start npm --name skyco -- start` and `pm2 startup` to persist across reboots.

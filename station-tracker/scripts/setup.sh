#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

info()  { printf "${BOLD}→ %s${NC}\n" "$1"; }
ok()    { printf "${GREEN}✓ %s${NC}\n" "$1"; }
warn()  { printf "${YELLOW}⚠ %s${NC}\n" "$1"; }
fail()  { printf "${RED}✗ %s${NC}\n" "$1"; exit 1; }

header() {
  echo ""
  printf "${BOLD}══════════════════════════════════════════${NC}\n"
  printf "${BOLD}  %s${NC}\n" "$1"
  printf "${BOLD}══════════════════════════════════════════${NC}\n"
  echo ""
}

# ── Detect mode ──────────────────────────────────────────────────────────────

MODE="${1:-}"

if [ -z "$MODE" ]; then
  echo "How would you like to run Skyco Station Tracker?"
  echo ""
  echo "  1) Docker   — runs app + Postgres in containers (recommended)"
  echo "  2) Native   — install dependencies and run with Node.js"
  echo ""
  printf "Enter 1 or 2: "
  read -r CHOICE
  case "$CHOICE" in
    1) MODE="docker" ;;
    2) MODE="native" ;;
    *) fail "Invalid choice. Run again and enter 1 or 2." ;;
  esac
fi

# ── .env file ────────────────────────────────────────────────────────────────

setup_env() {
  if [ ! -f .env ]; then
    info "Creating .env from .env.example"
    cp .env.example .env

    if grep -q "POSTGRES_PASSWORD=changeme" .env; then
      GENERATED_PW=$(openssl rand -base64 18 2>/dev/null || head -c 24 /dev/urandom | base64)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/POSTGRES_PASSWORD=changeme/POSTGRES_PASSWORD=$GENERATED_PW/" .env
      else
        sed -i "s/POSTGRES_PASSWORD=changeme/POSTGRES_PASSWORD=$GENERATED_PW/" .env
      fi
      ok "Generated random POSTGRES_PASSWORD"
    fi

    ok ".env created"
  else
    ok ".env already exists"
  fi
}

# ── Docker path ──────────────────────────────────────────────────────────────

setup_docker() {
  header "Docker Setup"

  if ! command -v docker &>/dev/null; then
    fail "Docker is not installed. Get it at https://docs.docker.com/get-docker/"
  fi
  ok "Docker found: $(docker --version)"

  if ! docker info &>/dev/null; then
    fail "Docker daemon is not running. Start Docker Desktop and try again."
  fi
  ok "Docker daemon is running"

  setup_env

  info "Building and starting containers"
  docker compose up -d --build

  info "Waiting for Postgres to be healthy"
  for i in $(seq 1 30); do
    if docker compose exec db pg_isready -U skyco &>/dev/null; then
      break
    fi
    sleep 1
  done
  ok "Postgres is ready"

  info "Running database migrations and seeding stations"
  docker compose run --rm migrate
  ok "Database migrated and stations seeded"

  header "Setup Complete"
  echo "  App running at: http://localhost:${PORT:-3000}"
  echo ""
  echo "  Useful commands:"
  echo "    docker compose logs -f app    # tail app logs"
  echo "    docker compose down           # stop everything"
  echo "    docker compose up -d --build  # rebuild after code changes"
  echo ""
}

# ── Native path ──────────────────────────────────────────────────────────────

setup_native() {
  header "Native Setup"

  if ! command -v node &>/dev/null; then
    fail "Node.js is not installed. Get v20+ at https://nodejs.org/"
  fi

  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -lt 20 ]; then
    fail "Node.js v20+ required (found v$(node -v))"
  fi
  ok "Node.js found: $(node -v)"

  if ! command -v npm &>/dev/null; then
    fail "npm is not installed"
  fi
  ok "npm found: $(npm -v)"

  setup_env

  info "Installing npm dependencies"
  npm install
  ok "Dependencies installed"

  # Check for DATABASE_URL
  if grep -q "^DATABASE_URL=" .env 2>/dev/null; then
    ok "DATABASE_URL is set in .env"
  else
    # Try to start Postgres via Docker if available
    if command -v docker &>/dev/null && docker info &>/dev/null; then
      info "No DATABASE_URL set — starting Postgres via Docker"
      docker compose up -d db

      for i in $(seq 1 30); do
        if docker compose exec db pg_isready -U skyco &>/dev/null; then
          break
        fi
        sleep 1
      done
      ok "Postgres container is running on localhost:5432"

      # Build DATABASE_URL from .env values
      PG_USER=$(grep "^POSTGRES_USER=" .env | cut -d= -f2)
      PG_PASS=$(grep "^POSTGRES_PASSWORD=" .env | cut -d= -f2)
      PG_DB=$(grep "^POSTGRES_DB=" .env | cut -d= -f2)
      DB_URL="postgresql://${PG_USER:-skyco}:${PG_PASS}@localhost:5432/${PG_DB:-station_tracker}"
      echo "DATABASE_URL=$DB_URL" >> .env
      ok "Added DATABASE_URL to .env"
    else
      warn "No DATABASE_URL in .env and Docker is not available."
      warn "Set DATABASE_URL in .env to point to your Postgres instance, then re-run."
      exit 1
    fi
  fi

  info "Running database migrations"
  npx prisma migrate deploy
  ok "Migrations applied"

  info "Seeding stations"
  npx tsx scripts/seed-stations-only.ts
  ok "Stations seeded"

  header "Setup Complete"
  echo "  Start the dev server:  npm run dev"
  echo "  Production build:      npm run build && npm start"
  echo ""
  echo "  App will be at: http://localhost:3000"
  echo ""
}

# ── Run ──────────────────────────────────────────────────────────────────────

case "$MODE" in
  docker) setup_docker ;;
  native) setup_native ;;
  *) fail "Unknown mode: $MODE. Use 'docker' or 'native'." ;;
esac

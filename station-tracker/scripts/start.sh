#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
BOLD='\033[1m'
RED='\033[0;31m'
NC='\033[0m'

info()  { printf "${BOLD}→ %s${NC}\n" "$1"; }
ok()    { printf "${GREEN}✓ %s${NC}\n" "$1"; }
fail()  { printf "${RED}✗ %s${NC}\n" "$1"; exit 1; }

MODE="${1:-auto}"

# ── Auto-detect ──────────────────────────────────────────────────────────────

if [ "$MODE" = "auto" ]; then
  if docker compose ps --status running 2>/dev/null | grep -q "app"; then
    MODE="docker"
  elif [ -d node_modules ]; then
    MODE="native"
  else
    fail "Run scripts/setup.sh first."
  fi
fi

# ── Docker ───────────────────────────────────────────────────────────────────

if [ "$MODE" = "docker" ]; then
  info "Starting containers"
  docker compose up -d
  ok "App running at http://localhost:${PORT:-3000}"
  echo ""
  echo "  Logs:   docker compose logs -f app"
  echo "  Stop:   docker compose down"
  exit 0
fi

# ── Native ───────────────────────────────────────────────────────────────────

if [ "$MODE" = "dev" ] || [ "$MODE" = "native" ]; then
  if [ ! -d node_modules ]; then
    fail "Dependencies not installed. Run scripts/setup.sh first."
  fi

  info "Starting dev server"
  npm run dev
  exit 0
fi

# ── Production ───────────────────────────────────────────────────────────────

if [ "$MODE" = "prod" ]; then
  if [ ! -d node_modules ]; then
    fail "Dependencies not installed. Run scripts/setup.sh first."
  fi

  info "Building for production"
  npm run build
  ok "Build complete"

  info "Starting production server"
  npm start
  exit 0
fi

echo "Usage: ./scripts/start.sh [docker|dev|prod|auto]"
echo ""
echo "  docker  — start Docker containers"
echo "  dev     — start Next.js dev server (hot reload)"
echo "  prod    — build and start production server"
echo "  auto    — detect which mode to use (default)"

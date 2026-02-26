#Requires -Version 5.1
param(
    [ValidateSet("docker", "dev", "prod", "auto", "")]
    [string]$Mode = "auto"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

function Write-Info ($msg) { Write-Host "-> $msg" -ForegroundColor Cyan }
function Write-Ok   ($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Fail ($msg) { Write-Host "[X] $msg" -ForegroundColor Red; exit 1 }

# ── Auto-detect ──────────────────────────────────────────────────────────────

if ($Mode -eq "auto") {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    $containerRunning = $false
    if ($docker) {
        $ps = docker compose ps --status running 2>&1
        if ($ps -match "app") { $containerRunning = $true }
    }

    if ($containerRunning) {
        $Mode = "docker"
    } elseif (Test-Path "node_modules") {
        $Mode = "dev"
    } else {
        Write-Fail "Run scripts/setup.ps1 first."
    }
}

# ── Docker ───────────────────────────────────────────────────────────────────

if ($Mode -eq "docker") {
    Write-Info "Starting containers"
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { Write-Fail "docker compose up failed" }

    $port = if ($env:PORT) { $env:PORT } else { "3000" }
    Write-Ok "App running at http://localhost:$port"
    Write-Host ""
    Write-Host "  Logs:   docker compose logs -f app"
    Write-Host "  Stop:   docker compose down"
    exit 0
}

# ── Dev ──────────────────────────────────────────────────────────────────────

if ($Mode -eq "dev") {
    if (-not (Test-Path "node_modules")) {
        Write-Fail "Dependencies not installed. Run scripts/setup.ps1 first."
    }

    Write-Info "Starting dev server"
    npm run dev
    exit 0
}

# ── Production ───────────────────────────────────────────────────────────────

if ($Mode -eq "prod") {
    if (-not (Test-Path "node_modules")) {
        Write-Fail "Dependencies not installed. Run scripts/setup.ps1 first."
    }

    Write-Info "Building for production"
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Fail "Build failed" }
    Write-Ok "Build complete"

    Write-Info "Starting production server"
    npm start
    exit 0
}

Write-Host "Usage: .\scripts\start.ps1 [-Mode] <docker|dev|prod|auto>"
Write-Host ""
Write-Host "  docker  - start Docker containers"
Write-Host "  dev     - start Next.js dev server (hot reload)"
Write-Host "  prod    - build and start production server"
Write-Host "  auto    - detect which mode to use (default)"

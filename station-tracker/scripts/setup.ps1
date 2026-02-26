#Requires -Version 5.1
param(
    [ValidateSet("docker", "native", "")]
    [string]$Mode = ""
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

function Write-Info  ($msg) { Write-Host "-> $msg" -ForegroundColor Cyan }
function Write-Ok    ($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn  ($msg) { Write-Host "[!] $msg" -ForegroundColor Yellow }
function Write-Fail  ($msg) { Write-Host "[X] $msg" -ForegroundColor Red; exit 1 }

function Write-Header ($msg) {
    Write-Host ""
    Write-Host ("=" * 50) -ForegroundColor White
    Write-Host "  $msg" -ForegroundColor White
    Write-Host ("=" * 50) -ForegroundColor White
    Write-Host ""
}

# ── Detect mode ──────────────────────────────────────────────────────────────

if (-not $Mode) {
    Write-Host "How would you like to run Skyco Station Tracker?"
    Write-Host ""
    Write-Host "  1) Docker   - runs app + Postgres in containers (recommended)"
    Write-Host "  2) Native   - install dependencies and run with Node.js"
    Write-Host ""
    $choice = Read-Host "Enter 1 or 2"
    switch ($choice) {
        "1" { $Mode = "docker" }
        "2" { $Mode = "native" }
        default { Write-Fail "Invalid choice. Run again and enter 1 or 2." }
    }
}

# ── .env file ────────────────────────────────────────────────────────────────

function Setup-Env {
    if (-not (Test-Path ".env")) {
        Write-Info "Creating .env from .env.example"
        Copy-Item ".env.example" ".env"

        $envContent = Get-Content ".env" -Raw
        if ($envContent -match "POSTGRES_PASSWORD=changeme") {
            $bytes = New-Object byte[] 18
            [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
            $pw = [Convert]::ToBase64String($bytes)
            $envContent = $envContent -replace "POSTGRES_PASSWORD=changeme", "POSTGRES_PASSWORD=$pw"
            Set-Content ".env" $envContent -NoNewline
            Write-Ok "Generated random POSTGRES_PASSWORD"
        }

        Write-Ok ".env created"
    } else {
        Write-Ok ".env already exists"
    }
}

# ── Docker path ──────────────────────────────────────────────────────────────

function Setup-Docker {
    Write-Header "Docker Setup"

    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-Fail "Docker is not installed. Get it at https://docs.docker.com/desktop/install/windows-install/"
    }
    Write-Ok "Docker found: $(docker --version)"

    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Docker daemon is not running. Start Docker Desktop and try again."
    }
    Write-Ok "Docker daemon is running"

    Setup-Env

    Write-Info "Building and starting containers"
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { Write-Fail "docker compose up failed" }

    Write-Info "Waiting for Postgres to be healthy"
    for ($i = 0; $i -lt 30; $i++) {
        $ready = docker compose exec db pg_isready -U skyco 2>&1
        if ($LASTEXITCODE -eq 0) { break }
        Start-Sleep -Seconds 1
    }
    Write-Ok "Postgres is ready"

    Write-Info "Running database migrations and seeding stations"
    docker compose run --rm migrate
    if ($LASTEXITCODE -ne 0) { Write-Fail "Migration failed" }
    Write-Ok "Database migrated and stations seeded"

    $port = if ($env:PORT) { $env:PORT } else { "3000" }

    Write-Header "Setup Complete"
    Write-Host "  App running at: http://localhost:$port"
    Write-Host ""
    Write-Host "  Useful commands:"
    Write-Host "    docker compose logs -f app    # tail app logs"
    Write-Host "    docker compose down           # stop everything"
    Write-Host "    docker compose up -d --build  # rebuild after code changes"
    Write-Host ""
}

# ── Native path ──────────────────────────────────────────────────────────────

function Setup-Native {
    Write-Header "Native Setup"

    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-Fail "Node.js is not installed. Get v20+ at https://nodejs.org/"
    }
    $nodeVer = (node -v) -replace "^v", ""
    $nodeMajor = [int]($nodeVer.Split(".")[0])
    if ($nodeMajor -lt 20) {
        Write-Fail "Node.js v20+ required (found v$nodeVer)"
    }
    Write-Ok "Node.js found: v$nodeVer"

    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npm) { Write-Fail "npm is not installed" }
    Write-Ok "npm found: $(npm -v)"

    Setup-Env

    Write-Info "Installing npm dependencies"
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed" }
    Write-Ok "Dependencies installed"

    $envContent = if (Test-Path ".env") { Get-Content ".env" -Raw } else { "" }
    $hasDbUrl = $envContent -match "(?m)^DATABASE_URL="

    if ($hasDbUrl) {
        Write-Ok "DATABASE_URL is set in .env"
    } else {
        $docker = Get-Command docker -ErrorAction SilentlyContinue
        $dockerRunning = $false
        if ($docker) {
            docker info 2>&1 | Out-Null
            $dockerRunning = ($LASTEXITCODE -eq 0)
        }

        if ($dockerRunning) {
            Write-Info "No DATABASE_URL set - starting Postgres via Docker"
            docker compose up -d db

            for ($i = 0; $i -lt 30; $i++) {
                docker compose exec db pg_isready -U skyco 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) { break }
                Start-Sleep -Seconds 1
            }
            Write-Ok "Postgres container is running on localhost:5432"

            $pgUser = "skyco"
            $pgPass = "changeme"
            $pgDb   = "station_tracker"
            foreach ($line in (Get-Content ".env")) {
                if ($line -match "^POSTGRES_USER=(.+)$")     { $pgUser = $Matches[1] }
                if ($line -match "^POSTGRES_PASSWORD=(.+)$") { $pgPass = $Matches[1] }
                if ($line -match "^POSTGRES_DB=(.+)$")       { $pgDb   = $Matches[1] }
            }
            $dbUrl = "postgresql://${pgUser}:${pgPass}@localhost:5432/${pgDb}"
            Add-Content ".env" "`nDATABASE_URL=$dbUrl"
            Write-Ok "Added DATABASE_URL to .env"
        } else {
            Write-Warn "No DATABASE_URL in .env and Docker is not available."
            Write-Warn "Set DATABASE_URL in .env to point to your Postgres instance, then re-run."
            exit 1
        }
    }

    Write-Info "Running database migrations"
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { Write-Fail "Prisma migrate failed" }
    Write-Ok "Migrations applied"

    Write-Info "Seeding stations"
    npx tsx scripts/seed-stations-only.ts
    if ($LASTEXITCODE -ne 0) { Write-Fail "Seed failed" }
    Write-Ok "Stations seeded"

    Write-Header "Setup Complete"
    Write-Host "  Start the dev server:  npm run dev"
    Write-Host "  Production build:      npm run build; npm start"
    Write-Host ""
    Write-Host "  App will be at: http://localhost:3000"
    Write-Host ""
}

# ── Run ──────────────────────────────────────────────────────────────────────

switch ($Mode) {
    "docker" { Setup-Docker }
    "native" { Setup-Native }
    default  { Write-Fail "Unknown mode: $Mode. Use 'docker' or 'native'." }
}

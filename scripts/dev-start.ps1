<#
.SYNOPSIS
  Start the Atlas development environment.
.DESCRIPTION
  Ensures Docker is running, starts PostgreSQL, applies migrations,
  builds all packages, and launches the API + web dev servers.
#>
param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"
Set-Location "$PSScriptRoot\.."

# ── Load .env ────────────────────────────────────────────────────────────────
if (Test-Path ".env") {
  Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      $name = $Matches[1].Trim()
      $value = $Matches[2].Trim()
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
  Write-Host "[atlas] Loaded .env" -ForegroundColor DarkGray
}

# ── Preflight checks ────────────────────────────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "[atlas] Docker not found. Please install Docker Desktop." -ForegroundColor Red
  exit 1
}

# ── Start PostgreSQL ─────────────────────────────────────────────────────────
Write-Host "[atlas] Starting PostgreSQL..." -ForegroundColor Cyan
docker compose up -d --wait
Write-Host "[atlas] PostgreSQL is ready." -ForegroundColor Green

# ── Install dependencies if needed ───────────────────────────────────────────
if (-not (Test-Path "node_modules")) {
  Write-Host "[atlas] Installing dependencies..." -ForegroundColor Cyan
  pnpm install
}

# ── Run migrations ───────────────────────────────────────────────────────────
Write-Host "[atlas] Applying database migrations..." -ForegroundColor Cyan
Push-Location "apps/api"
npx prisma migrate deploy 2>&1 | Out-Host
Pop-Location
Write-Host "[atlas] Migrations applied." -ForegroundColor Green

# ── Build ────────────────────────────────────────────────────────────────────
if (-not $SkipBuild) {
  Write-Host "[atlas] Building all packages..." -ForegroundColor Cyan
  pnpm build
  Write-Host "[atlas] Build complete." -ForegroundColor Green
}

# ── Kill any process on port 3000 ────────────────────────────────────────────
$listening = netstat -aon 2>$null | Select-String ":3000\s+.*LISTENING\s+(\d+)"
if ($listening) {
  $pids = $listening | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
  foreach ($procId in $pids) {
    Write-Host "[atlas] Killing stale process on port 3000 (PID $procId)..." -ForegroundColor Yellow
    taskkill /F /PID $procId 2>&1 | Out-Null
  }
  Start-Sleep -Seconds 1
}

# ── Start dev servers ────────────────────────────────────────────────────────
Write-Host "[atlas] Starting dev servers (API :3000, Web :5173)..." -ForegroundColor Cyan
pnpm dev

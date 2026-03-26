<#
.SYNOPSIS
  Stop the Atlas development environment.
.DESCRIPTION
  Kills any processes on API/web ports and optionally stops PostgreSQL.
#>
param(
  [switch]$IncludeDb
)

$ErrorActionPreference = "Continue"
Set-Location "$PSScriptRoot\.."

# ── Kill API on port 3000 ────────────────────────────────────────────────────
$api = netstat -aon 2>$null | Select-String ":3000\s+.*LISTENING\s+(\d+)"
if ($api) {
  $pids = $api | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
  foreach ($procId in $pids) {
    Write-Host "[atlas] Stopping API process (PID $procId)..." -ForegroundColor Yellow
    taskkill /F /PID $procId 2>&1 | Out-Null
  }
} else {
  Write-Host "[atlas] No process on port 3000." -ForegroundColor DarkGray
}

# ── Kill web on port 5173 ───────────────────────────────────────────────────
$web = netstat -aon 2>$null | Select-String ":5173\s+.*LISTENING\s+(\d+)"
if ($web) {
  $pids = $web | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
  foreach ($procId in $pids) {
    Write-Host "[atlas] Stopping web process (PID $procId)..." -ForegroundColor Yellow
    taskkill /F /PID $procId 2>&1 | Out-Null
  }
} else {
  Write-Host "[atlas] No process on port 5173." -ForegroundColor DarkGray
}

# ── Optionally stop PostgreSQL ───────────────────────────────────────────────
if ($IncludeDb) {
  Write-Host "[atlas] Stopping PostgreSQL..." -ForegroundColor Cyan
  docker compose down
  Write-Host "[atlas] PostgreSQL stopped." -ForegroundColor Green
} else {
  Write-Host "[atlas] PostgreSQL left running (use -IncludeDb to stop it)." -ForegroundColor DarkGray
}

Write-Host "[atlas] Stopped." -ForegroundColor Green

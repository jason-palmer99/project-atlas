<#
.SYNOPSIS
  Restart the Atlas development environment.
.DESCRIPTION
  Stops running dev processes, rebuilds, and starts fresh.
#>
param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."

Write-Host "[atlas] Restarting development environment..." -ForegroundColor Cyan
Write-Host ""

# ── Stop ─────────────────────────────────────────────────────────────────────
& "$PSScriptRoot\dev-stop.ps1"
Write-Host ""

# ── Start ────────────────────────────────────────────────────────────────────
if ($SkipBuild) {
  & "$PSScriptRoot\dev-start.ps1" -SkipBuild
} else {
  & "$PSScriptRoot\dev-start.ps1"
}

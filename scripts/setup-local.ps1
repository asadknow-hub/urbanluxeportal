# UrbanLuxe Portal — local dev setup helper
# Run from repo root: .\scripts\setup-local.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "UrbanLuxe Portal — local setup" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing npm dependencies..."
  npm install
}

if (-not (Test-Path ".env.local")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Created .env.local from .env.example"
  } else {
    Write-Host "Missing .env.local — copy .env.example and fill in Supabase keys." -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Option A — pull env from Vercel (recommended if deployed):" -ForegroundColor Green
Write-Host "  vercel login"
Write-Host "  vercel link    # select urbanluxeportal"
Write-Host "  vercel env pull .env.local"
Write-Host ""
Write-Host "Option B — Supabase dashboard:" -ForegroundColor Green
Write-Host "  https://supabase.com/dashboard/project/dpzcnokaihewwirlvysq/settings/api"
Write-Host "  Copy anon + service_role keys into .env.local"
Write-Host ""
Write-Host "Demo login (if seeded):" -ForegroundColor Green
Write-Host "  admin@urbanluxe.ae / UrbanLuxe@2026"
Write-Host ""
Write-Host "Start dev server: npm run dev" -ForegroundColor Cyan

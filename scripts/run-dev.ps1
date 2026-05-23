# Run ShadowNet backend + frontend (two terminals, no root node_modules)
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting ShadowNet API on port 5001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "Starting ShadowNet UI on http://localhost:5173 ..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

Write-Host "Done. Login: analyst@shadownet.ai / ShadowNet2026!" -ForegroundColor Green

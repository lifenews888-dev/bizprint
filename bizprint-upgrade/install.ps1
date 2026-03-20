# BizPrint Backend Upgrade - Install Script
# Run from: C:\Users\User\projects\bizprint

$backend = "C:\Users\User\projects\bizprint\backend\src"

Write-Host "=== BizPrint Backend Upgrade ===" -ForegroundColor Cyan
Write-Host ""

# 1. Backup originals
Write-Host "[1/4] Backing up original files..." -ForegroundColor Yellow
Copy-Item "$backend\delivery\delivery.entity.ts" "$backend\delivery\delivery.entity.ts.bak" -Force -ErrorAction SilentlyContinue
Copy-Item "$backend\files\file.entity.ts" "$backend\files\file.entity.ts.bak" -Force -ErrorAction SilentlyContinue
Copy-Item "$backend\ai\pdf-inspector\pdf-inspector.service.ts" "$backend\ai\pdf-inspector\pdf-inspector.service.ts.bak" -Force -ErrorAction SilentlyContinue
Write-Host "  Done" -ForegroundColor Green

# 2. Copy updated files
Write-Host "[2/4] Copying updated files..." -ForegroundColor Yellow

# Delivery entity (enum fix)
Copy-Item ".\backend-files\delivery\delivery.entity.ts" "$backend\delivery\delivery.entity.ts" -Force
Write-Host "  delivery.entity.ts (PENDING enum added)" -ForegroundColor Green

# File entity (upgraded)
Copy-Item ".\backend-files\files\file.entity.ts" "$backend\files\file.entity.ts" -Force
Write-Host "  file.entity.ts (version tracking, analysis)" -ForegroundColor Green

# Files module, service, controller (new)
Copy-Item ".\backend-files\files\files.module.ts" "$backend\files\files.module.ts" -Force
Copy-Item ".\backend-files\files\files.service.ts" "$backend\files\files.service.ts" -Force
Copy-Item ".\backend-files\files\files.controller.ts" "$backend\files\files.controller.ts" -Force
Write-Host "  files.module.ts, files.service.ts, files.controller.ts (NEW)" -ForegroundColor Green

# PDF Inspector (upgraded)
Copy-Item ".\backend-files\ai\pdf-inspector\pdf-inspector.service.ts" "$backend\ai\pdf-inspector\pdf-inspector.service.ts" -Force
Write-Host "  pdf-inspector.service.ts (preflight checks)" -ForegroundColor Green

# 3. Update app.module.ts - add FilesModule import
Write-Host "[3/4] Updating app.module.ts..." -ForegroundColor Yellow
$appModule = Get-Content "$backend\app.module.ts" -Raw

if ($appModule -notmatch "FilesModule") {
    # Add import line
    $appModule = $appModule -replace "(import \{ MenusModule \} from './menus/menus.module')", "`$1`nimport { FilesModule } from './files/files.module'"
    
    # Add to imports array
    $appModule = $appModule -replace "(MenusModule,\s*\])", "MenusModule,`n    FilesModule,`n  ]"
    
    Set-Content "$backend\app.module.ts" $appModule -Encoding UTF8
    Write-Host "  FilesModule added to app.module.ts" -ForegroundColor Green
} else {
    Write-Host "  FilesModule already exists in app.module.ts" -ForegroundColor Gray
}

# 4. Summary
Write-Host ""
Write-Host "[4/4] DONE!" -ForegroundColor Green
Write-Host ""
Write-Host "=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. pgAdmin-d fix-enums.sql ажиллуулна (delivery enum засах)" -ForegroundColor White
Write-Host "2. Backend restart хийнэ:" -ForegroundColor White
Write-Host "   taskkill /f /im node.exe" -ForegroundColor Gray
Write-Host "   cd C:\Users\User\projects\bizprint\backend" -ForegroundColor Gray
Write-Host "   npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "=== NEW API ENDPOINTS ===" -ForegroundColor Cyan
Write-Host "GET    /order-files?order_id=xxx     - Order-ийн бүх файлууд" -ForegroundColor White
Write-Host "GET    /order-files/final/:orderId   - Final файл" -ForegroundColor White
Write-Host "POST   /order-files                  - Файл бүртгэх" -ForegroundColor White
Write-Host "PATCH  /order-files/:id/approve      - Файл батлах" -ForegroundColor White
Write-Host "PATCH  /order-files/:id/reject       - Файл буцаах" -ForegroundColor White
Write-Host "PATCH  /order-files/:id/set-final    - Final болгох" -ForegroundColor White
Write-Host "PATCH  /order-files/:id/analysis     - AI analysis хадгалах" -ForegroundColor White
Write-Host "DELETE /order-files/:id              - Устгах" -ForegroundColor White
Write-Host ""

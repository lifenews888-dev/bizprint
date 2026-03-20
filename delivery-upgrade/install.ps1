# BizPrint Delivery Webhook Upgrade
# Run from: C:\Users\User\projects\bizprint

$backend = "C:\Users\User\projects\bizprint\backend\src\delivery"

Write-Host "=== Delivery Webhook Upgrade ===" -ForegroundColor Cyan

# 1. Backup
Write-Host "[1/3] Backup..." -ForegroundColor Yellow
Copy-Item "$backend\delivery.entity.ts" "$backend\delivery.entity.ts.bak" -Force
Copy-Item "$backend\delivery.service.ts" "$backend\delivery.service.ts.bak" -Force
Copy-Item "$backend\delivery.controller.ts" "$backend\delivery.controller.ts.bak" -Force
Copy-Item "$backend\delivery.module.ts" "$backend\delivery.module.ts.bak" -Force

# 2. Copy
Write-Host "[2/3] Copying files..." -ForegroundColor Yellow
Copy-Item ".\delivery.entity.ts" "$backend\delivery.entity.ts" -Force
Copy-Item ".\delivery.service.ts" "$backend\delivery.service.ts" -Force
Copy-Item ".\delivery.controller.ts" "$backend\delivery.controller.ts" -Force
Copy-Item ".\delivery.module.ts" "$backend\delivery.module.ts" -Force
Copy-Item ".\delivery-webhook.entity.ts" "$backend\delivery-webhook.entity.ts" -Force
Copy-Item ".\webhook.service.ts" "$backend\webhook.service.ts" -Force

Write-Host "[3/3] DONE!" -ForegroundColor Green
Write-Host ""
Write-Host "=== NEW API ENDPOINTS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "--- Delivery Provider Integration ---" -ForegroundColor Yellow
Write-Host "POST   /delivery/provider/assign     - Гадны апп хүргэлт оноох" -ForegroundColor White
Write-Host "POST   /delivery/provider/callback   - Гадны апп статус шинэчлэх" -ForegroundColor White
Write-Host "GET    /delivery/:id/tracking         - Tracking мэдээлэл" -ForegroundColor White
Write-Host ""
Write-Host "--- Webhook Management ---" -ForegroundColor Yellow
Write-Host "GET    /delivery/webhooks/list        - Бүх webhook жагсаалт" -ForegroundColor White
Write-Host "POST   /delivery/webhooks             - Webhook бүртгэх" -ForegroundColor White
Write-Host "PATCH  /delivery/webhooks/:id         - Webhook засах" -ForegroundColor White
Write-Host "DELETE /delivery/webhooks/:id         - Webhook устгах" -ForegroundColor White
Write-Host "POST   /delivery/webhooks/:id/test    - Webhook тест" -ForegroundColor White
Write-Host ""
Write-Host "--- Webhook Events ---" -ForegroundColor Yellow
Write-Host "delivery_created    - Хүргэлт үүссэн" -ForegroundColor Gray
Write-Host "status_changed      - Статус шилжсэн" -ForegroundColor Gray
Write-Host "delivery_completed  - Хүргэлт дууссан" -ForegroundColor Gray
Write-Host ""
Write-Host "Restart: taskkill /f /im node.exe && cd backend && npm run start:dev" -ForegroundColor Gray

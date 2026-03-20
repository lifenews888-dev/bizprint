Write-Host ""
Write-Host "==============================="
Write-Host " BizPrint Backend Audit Script "
Write-Host "==============================="
Write-Host ""

# ----------------------------------
# API Endpoint Check
# ----------------------------------

$base = "http://localhost:3000"

$endpoints = @(
"/auth/login",
"/auth/register",
"/auth/me",
"/print-sizes",
"/paper-types",
"/machines",
"/price/print-quote"
)

Write-Host "API ENDPOINT TEST"
Write-Host "------------------"

foreach ($ep in $endpoints) {
    try {
        $res = Invoke-WebRequest "$base$ep" -Method GET -TimeoutSec 3
        Write-Host "$ep  OK  ($($res.StatusCode))"
    }
    catch {
        Write-Host "$ep  FAILED"
    }
}

Write-Host ""

# ----------------------------------
# Module Check
# ----------------------------------

Write-Host "MODULE CHECK"
Write-Host "-------------"

$modules = @(
"auth",
"users",
"products",
"pricing",
"orders",
"vendors",
"files",
"payments"
)

foreach ($m in $modules) {

    if (Test-Path "./src/modules/$m") {
        Write-Host "$m module FOUND"
    }
    else {
        Write-Host "$m module MISSING"
    }

}

Write-Host ""

# ----------------------------------
# Controller Count
# ----------------------------------

Write-Host "CONTROLLER COUNT"
Write-Host "----------------"

$controllers = Get-ChildItem -Recurse -Filter "*controller.ts" -ErrorAction SilentlyContinue

Write-Host "Controllers:" $controllers.Count

Write-Host ""

# ----------------------------------
# Service Count
# ----------------------------------

Write-Host "SERVICE COUNT"
Write-Host "-------------"

$services = Get-ChildItem -Recurse -Filter "*service.ts" -ErrorAction SilentlyContinue

Write-Host "Services:" $services.Count

Write-Host ""

# ----------------------------------
# Code Size
# ----------------------------------

Write-Host "CODE SIZE"
Write-Host "---------"

$files = Get-ChildItem -Recurse -Include *.ts -ErrorAction SilentlyContinue
$lines = 0

foreach ($file in $files) {
    $lines += (Get-Content $file).Count
}

Write-Host "TypeScript Files:" $files.Count
Write-Host "Total Lines:" $lines

Write-Host ""

# ----------------------------------
# Database Check (Docker)
# ----------------------------------

Write-Host "DATABASE CHECK"
Write-Host "--------------"

try {
    docker ps | Out-Null
    Write-Host "Docker running"
}
catch {
    Write-Host "Docker not detected"
}

Write-Host ""

Write-Host "==============================="
Write-Host " Audit Completed "
Write-Host "==============================="
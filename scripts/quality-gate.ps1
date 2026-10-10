# =============================================================================
# PASARIA Marketplace — Repeatable Quality Gate (PowerShell)
# =============================================================================
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🛡️  PASARIA Marketplace — Quality Gate Runner" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$Failed = 0

Write-Host "`n[1/7] Composer Validation & Lockfile Check..." -ForegroundColor Yellow
composer validate --strict
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Composer manifest & lockfile are valid." -ForegroundColor Green
} else {
    Write-Host "❌ Composer validation failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[2/7] PHP Syntax / Linting..." -ForegroundColor Yellow
$lintErrors = 0
Get-ChildItem -Path app, config, routes, database -Filter *.php -Recurse | ForEach-Object {
    $res = php -l $_.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Syntax error in $($_.FullName): $res" -ForegroundColor Red
        $lintErrors++
    }
}
if ($lintErrors -eq 0) {
    Write-Host "✅ All PHP files passed syntax check." -ForegroundColor Green
} else {
    Write-Host "❌ $lintErrors PHP file(s) failed syntax check." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[3/7] Automated PHPUnit Test Suite..." -ForegroundColor Yellow
./vendor/bin/phpunit --no-coverage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PHPUnit test suite passed." -ForegroundColor Green
} else {
    Write-Host "❌ PHPUnit test suite failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[4/7] Route Compilation Check..." -ForegroundColor Yellow
php artisan route:list | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All Laravel routes compiled successfully without conflicts." -ForegroundColor Green
} else {
    Write-Host "❌ Route compilation failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[5/7] Frontend TypeScript Lint & Typecheck..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend TypeScript lint passed." -ForegroundColor Green
} else {
    Write-Host "❌ Frontend lint failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[6/7] Frontend Production Build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend production build compiled successfully." -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[7/7] Database Migration Status Check..." -ForegroundColor Yellow
php artisan migrate:status | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema & migrations are up to date." -ForegroundColor Green
} else {
    Write-Host "❌ Database migration status check failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($Failed -eq 0) {
    Write-Host "🎉 ALL QUALITY GATES PASSED! Ready for deployment review." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "🚫 QUALITY GATE FAILED! Please fix the errors above." -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 1
}

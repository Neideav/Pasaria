# =============================================================================
# PASARIA Marketplace - Repeatable Quality Gate (PowerShell)
# =============================================================================
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[PASARIA Marketplace] Quality Gate Runner" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$Failed = 0

Write-Host "`n[1/7] Composer Validation and Lockfile Check..." -ForegroundColor Yellow
composer validate --strict
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Composer manifest and lockfile are valid." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Composer validation failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[2/7] PHP Syntax / Linting..." -ForegroundColor Yellow
$lintErrors = 0
Get-ChildItem -Path app, config, routes, database -Filter *.php -Recurse | ForEach-Object {
    $res = php -l $_.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FAIL] Syntax error in $($_.FullName): $res" -ForegroundColor Red
        $lintErrors++
    }
}
if ($lintErrors -eq 0) {
    Write-Host "[OK] All PHP files passed syntax check." -ForegroundColor Green
} else {
    Write-Host "[FAIL] $lintErrors PHP file(s) failed syntax check." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[3/7] Automated PHPUnit Test Suite..." -ForegroundColor Yellow
./vendor/bin/phpunit --no-coverage
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] PHPUnit test suite passed." -ForegroundColor Green
} else {
    Write-Host "[FAIL] PHPUnit test suite failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[4/7] Route Compilation Check..." -ForegroundColor Yellow
$origEnv = $env:APP_ENV
$origKey = $env:APP_KEY
$origConn = $env:DB_CONNECTION
$origDb = $env:DB_DATABASE

if (-not $env:APP_ENV) { $env:APP_ENV = "testing" }
if (-not $env:APP_KEY) { $env:APP_KEY = "base64:jtuPhVvis2tagZg5n1m9odS9/DR0O06LVWk2JTCF6R4=" }
if (-not $env:DB_CONNECTION) { $env:DB_CONNECTION = "sqlite" }
if (-not $env:DB_DATABASE) { $env:DB_DATABASE = ":memory:" }

php artisan route:list --env=testing | Out-Null
$routeExit = $LASTEXITCODE

$env:APP_ENV = $origEnv
$env:APP_KEY = $origKey
$env:DB_CONNECTION = $origConn
$env:DB_DATABASE = $origDb

if ($routeExit -eq 0) {
    Write-Host "[OK] All Laravel routes compiled successfully without conflicts." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Route compilation failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[5/7] Frontend TypeScript Lint and Typecheck..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend TypeScript lint passed." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend lint failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[6/7] Frontend Production Build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend production build compiled successfully." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend build failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n[7/7] Database Migration Status Check..." -ForegroundColor Yellow
php artisan migrate:status | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database schema and migrations are up to date." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Database migration status check failed." -ForegroundColor Red
    $Failed = 1
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($Failed -eq 0) {
    Write-Host "[SUCCESS] ALL QUALITY GATES PASSED! Ready for deployment review." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "[ERROR] QUALITY GATE FAILED! Please fix the errors above." -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 1
}

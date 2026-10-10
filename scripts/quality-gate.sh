#!/usr/bin/env bash
# =============================================================================
# PASARIA Marketplace — Repeatable Quality Gate
# =============================================================================
set -euo pipefail

echo "=========================================================="
echo "🛡️  PASARIA Marketplace — Quality Gate Runner"
echo "=========================================================="

FAILED=0

echo -e "\n[1/7] Composer Validation & Lockfile Check..."
if composer validate --strict; then
    echo "✅ Composer manifest & lockfile are valid."
else
    echo "❌ Composer validation failed."
    FAILED=1
fi

echo -e "\n[2/7] PHP Syntax / Linting..."
LINT_ERRORS=0
while IFS= read -r -d '' file; do
    if ! php -l "$file" > /dev/null 2>&1; then
        echo "❌ Syntax error in $file"
        LINT_ERRORS=$((LINT_ERRORS + 1))
    fi
done < <(find app config routes database -type f -name "*.php" -print0)

if [ "$LINT_ERRORS" -eq 0 ]; then
    echo "✅ All PHP files passed syntax check."
else
    echo "❌ $LINT_ERRORS PHP file(s) failed syntax check."
    FAILED=1
fi

echo -e "\n[3/7] Automated PHPUnit Test Suite..."
if ./vendor/bin/phpunit --no-coverage; then
    echo "✅ PHPUnit test suite passed."
else
    echo "❌ PHPUnit test suite failed."
    FAILED=1
fi

echo -e "\n[4/7] Route Compilation Check..."
if php artisan route:list > /dev/null; then
    echo "✅ All Laravel routes compiled successfully without conflicts."
else
    echo "❌ Route compilation failed."
    FAILED=1
fi

echo -e "\n[5/7] Frontend TypeScript Lint & Typecheck..."
if npm run lint; then
    echo "✅ Frontend TypeScript lint passed."
else
    echo "❌ Frontend lint failed."
    FAILED=1
fi

echo -e "\n[6/7] Frontend Production Build..."
if npm run build; then
    echo "✅ Frontend production build compiled successfully."
else
    echo "❌ Frontend build failed."
    FAILED=1
fi

echo -e "\n[7/7] Database Migration Status Check..."
if php artisan migrate:status > /dev/null; then
    echo "✅ Database schema & migrations are up to date."
else
    echo "❌ Database migration status check failed."
    FAILED=1
fi

echo -e "\n=========================================================="
if [ "$FAILED" -eq 0 ]; then
    echo "🎉 ALL QUALITY GATES PASSED! Ready for deployment review."
    echo "=========================================================="
    exit 0
else
    echo "🚫 QUALITY GATE FAILED! Please fix the errors above."
    echo "=========================================================="
    exit 1
fi

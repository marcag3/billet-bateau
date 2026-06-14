#!/bin/sh

# Set default values for Laravel automations
: "${AUTORUN_ENABLED:=false}"

if [ -f "$APP_BASE_DIR/artisan" ] && [ "$AUTORUN_ENABLED" = "true" ]; then
    echo "🌅  running one-time operations"
    php "$APP_BASE_DIR/artisan" operations:process
fi

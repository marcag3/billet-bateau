#!/bin/sh

# Set default values for Laravel automations
: "${AUTORUN_ENABLED:=false}"

if [ -f "$APP_BASE_DIR/artisan" ] && [ "$AUTORUN_ENABLED" = "true" ]; then
    # echo "💩  clear cache"
    # php "$APP_BASE_DIR/artisan" cache:clear

    # Cache views separately (after config:cache and icons:cache)
    # This works around a Laravel 11+ bug where artisan optimize
    # fails to register Blade Icons components before view compilation
    # See: https://github.com/laravel/framework/issues/50619
    # echo "🖼  cache views (after icons registration)"
    # php "$APP_BASE_DIR/artisan" view:cache

    echo "📦  configuring object storage (Garage CORS for browser uploads)"
    storage_configured=false
    attempt=1
    while [ "$attempt" -le 30 ]; do
        if php "$APP_BASE_DIR/artisan" storage:configure --no-interaction; then
            storage_configured=true
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    if [ "$storage_configured" != "true" ]; then
        echo "Warning: storage:configure failed after 30 attempts; browser uploads may fail until Garage is reachable and CORS is applied." >&2
    fi

    echo "🌅  running one-time operations"
    php "$APP_BASE_DIR/artisan" operations:process
fi
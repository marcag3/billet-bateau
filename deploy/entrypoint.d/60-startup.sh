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

    echo "🌅  running one-time operations"
    php "$APP_BASE_DIR/artisan" operations:process
fi
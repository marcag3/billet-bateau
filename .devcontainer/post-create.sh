#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

if [[ "$(id -u)" -eq 0 ]]; then
    chown -R sail:sail /var/www/html
    exec su - sail -c "bash /var/www/html/.devcontainer/post-create.sh"
fi

echo "==> Installing PHP dependencies"
composer install --no-interaction --prefer-dist

if [[ ! -f .env ]]; then
    echo "==> Creating .env from .env.example"
    cp .env.example .env
fi

if ! grep -qE '^APP_KEY=base64:' .env; then
    echo "==> Generating application key"
    php artisan key:generate --force --no-interaction
fi

echo "==> Waiting for PostgreSQL"
for attempt in $(seq 1 30); do
    if php artisan db:show --no-interaction >/dev/null 2>&1; then
        break
    fi
    if [[ "${attempt}" -eq 30 ]]; then
        echo "Database not ready after 30 attempts" >&2
        exit 1
    fi
    sleep 2
done

echo "==> Running migrations"
php artisan migrate --force --no-interaction

echo "==> Configuring object storage (S3 CORS for browser uploads)"
for attempt in $(seq 1 30); do
    if php artisan storage:configure --no-interaction; then
        break
    fi
    if [[ "${attempt}" -eq 30 ]]; then
        echo "Warning: storage:configure failed; run 'php artisan storage:configure' once RustFS is reachable" >&2
    fi
    sleep 2
done

echo "==> Installing Node dependencies"
npm ci

echo "==> Dev container ready"

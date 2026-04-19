############################################
# Shared PHP runtime
############################################
FROM serversideup/php:8.5-frankenphp AS base

WORKDIR /var/www/html

USER root

RUN install-php-extensions intl gd exif

############################################
# Development tools (Sail-like all-in-one)
############################################
FROM base AS devtools

ARG NODE_VERSION=22

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        dnsutils \
        ffmpeg \
        fswatch \
        git \
        gnupg \
        nano \
        postgresql-client \
        redis-tools \
        sqlite3 \
        unzip \
        zip \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g pnpm bun \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN if ! command -v composer >/dev/null 2>&1; then \
        curl -sLS https://getcomposer.org/installer | php -- --install-dir=/usr/bin --filename=composer; \
    fi

############################################
# Development runtime target
############################################
FROM devtools AS development

ARG WWWGROUP=1000
ARG WWWUSER=1000

RUN groupadd --force -g "${WWWGROUP}" sail \
    && useradd -ms /bin/bash --no-user-group -g "${WWWGROUP}" -u "${WWWUSER}" sail \
    && mkdir -p /composer/cache \
    && mkdir -p /home/sail/.composer \
    && chown -R sail:sail /composer /home/sail /var/www/html

RUN git config --global --add safe.directory /var/www/html

USER sail

############################################
# Production build stages
############################################
FROM base AS composer_deps

WORKDIR /var/www/html

COPY composer.json artisan composer.lock ./
COPY bootstrap/ bootstrap/

RUN composer install \
    --optimize-autoloader \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist

FROM node:22-alpine AS frontend_assets

WORKDIR /var/www/html

COPY package.json package-lock.json vite.config.js ./
COPY resources/frontend/ resources/frontend/
COPY --from=composer_deps /var/www/html/vendor/ vendor/

RUN npm ci && npm run build

############################################
# Production runtime target
############################################
FROM base AS production

WORKDIR /var/www/html

ENV S6_CMD_WAIT_FOR_SERVICES=1

COPY --chmod=755 ./.deploy/entrypoint.d/ /etc/entrypoint.d/
COPY --chown=www-data:www-data . .
COPY --from=composer_deps /var/www/html/vendor/ ./vendor
COPY --from=frontend_assets /var/www/html/public/build ./public/build

RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

USER www-data
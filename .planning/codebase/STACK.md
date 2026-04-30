# Technology Stack

**Analysis Date:** 2026-04-30

## Languages

**Primary:**
- PHP (8.3+ per `composer.json`, 8.5 runtime image in `Dockerfile`) - Backend API, domain logic, auth, sync token issuance in `app/` and `config/`.
- TypeScript (5.9.x toolchain) - Frontend app, offline sync runtime, router/models/services in `resources/js/`.

**Secondary:**
- Vue SFC (`.vue`, Vue 3.5.x) - UI pages, layouts, and components in `resources/js/pages/`, `resources/js/layouts/`, and `resources/js/components/`.
- SQL (PostgreSQL + PostGIS) - Relational/geospatial persistence via migrations in `database/migrations/` and container setup in `compose.yaml`.
- YAML - Infra and sync config in `.github/workflows/*.yml` and `docker/powersync/*.yaml`.

## Runtime

**Environment:**
- PHP/FrankenPHP container runtime (`serversideup/php:8.5-frankenphp`) in `Dockerfile`.
- Node.js 24 for frontend build and CI in `Dockerfile`, `compose.dev.yaml`, and `.github/workflows/test.yml`.

**Package Manager:**
- Composer (PHP dependencies) - lockfile present at `composer.lock`.
- npm (frontend dependencies/scripts) - lockfile present at `package-lock.json`.

## Frameworks

**Core:**
- Laravel 13 (`laravel/framework`) - HTTP API, auth/session middleware, config, queues, policies in `app/`, `routes/`, `config/`.
- Vue 3 + Vue Router + Pinia - SPA shell and state/navigation in `resources/js/app.main.ts`, `resources/js/router/index.ts`, `resources/js/store/`.
- Quasar 2 - component framework/theme integration in `resources/js/app.main.ts` and `resources/js/utilities/app-quasar-theme.ts`.

**Testing:**
- PHPUnit 12 - backend unit/feature tests configured in `phpunit.xml`, tests in `tests/Feature/` and `tests/Unit/`.
- Vitest 4 + Testing Library Vue - frontend tests via `package.json` scripts and config in `vite.config.ts`.

**Build/Dev:**
- Vite 7 - frontend build/dev server in `vite.config.ts`.
- `laravel-vite-plugin` + `@vitejs/plugin-vue` - Laravel/Vue integration in `vite.config.ts`.
- `vite-plugin-pwa` - service worker and manifest build pipeline in `vite.config.ts` and `resources/js/service-worker/app-sw.ts`.
- ESLint 9 + TypeScript ESLint + eslint-plugin-vue - frontend linting in `eslint.config.js`.

## Key Dependencies

**Critical:**
- `@powersync/web` + `@tanstack/db` + `@tanstack/powersync-db-collection` - local-first sync and client DB orchestration in `resources/js/powersync/app-powersync.runtime.ts`.
- `firebase/php-jwt` - PowerSync credential JWT signing in `app/Services/PowerSyncTokenIssuer.php`.
- `spatie/laravel-data` - DTO-driven API payloads and validation in `app/Data/`.
- `clickbar/laravel-magellan` - PostGIS geometry handling for water routes in `app/Models/WaterRoute.php` and water route migrations.

**Infrastructure:**
- `laravel/sanctum` - cookie/session-based API authentication in `routes/api.php`, `routes/web.php`, and `config/sanctum.php`.
- `spatie/laravel-medialibrary` - media ingestion/storage abstraction in `app/Http/Controllers/Api/MediaController.php` and `config/media-library.php`.
- `laravel/telescope` - local observability/debug tooling via `config/telescope.php`.
- `redis` (service + drivers) - cache/queue/session backend options in `config/cache.php`, `config/queue.php`, `config/database.php`, and `compose.yaml`.

## Configuration

**Environment:**
- Environment-driven Laravel config under `config/*.php` with `env()` indirection.
- Local env template exists at `.env.example`; runtime secrets are expected from `.env` and container env wiring in `compose*.yaml`.
- PowerSync-specific settings are centralized in `config/powersync.php` and `docker/powersync/service.yaml`.

**Build:**
- Frontend bundling and PWA config in `vite.config.ts`.
- Typecheck config in `tsconfig.typecheck.json`.
- Lint config in `eslint.config.js`.
- CI build/test workflows in `.github/workflows/build.yml` and `.github/workflows/test.yml`.

## Platform Requirements

**Development:**
- Docker Compose stack in `compose.yaml` + `compose.dev.yaml` with services for PostgreSQL/PostGIS, PowerSync, Redis, S3-compatible object storage (Garage), Mailpit, and Laravel app runtime.
- Browser with Service Worker + IndexedDB/WASM support for offline runtime (`@journeyapps/wa-sqlite`, `@powersync/web`) in `resources/js/powersync/app-powersync.runtime.ts`.

**Production:**
- Containerized deployment path via `compose.prod.yaml` using production image builds from `Dockerfile`.
- Externalized PostgreSQL and Redis host configuration expected in production service env (`compose.prod.yaml`).
- Image publishing pipeline to GitHub Container Registry (`ghcr.io`) in `.github/workflows/build.yml`.

---

*Stack analysis: 2026-04-30*

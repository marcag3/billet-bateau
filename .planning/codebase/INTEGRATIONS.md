# External Integrations

**Analysis Date:** 2026-04-30

## APIs & External Services

**Sync & Offline Data:**
- PowerSync service - bi-directional sync for staff/offline app data.
  - SDK/Client: `@powersync/web` in `resources/js/powersync/app-powersync.runtime.ts`.
  - Auth: `POWERSYNC_PUBLIC_URL`, `POWERSYNC_JWT_SECRET`, `POWERSYNC_JWT_KID`, `POWERSYNC_JWT_AUDIENCE`, `POWERSYNC_JWT_TTL_SECONDS` via `config/powersync.php` and `app/Services/PowerSyncTokenIssuer.php`.

**Media & Object Storage:**
- S3-compatible object storage (Garage in local stack) for media assets routed through Laravel filesystem/media library.
  - SDK/Client: Laravel filesystem `s3` disk in `config/filesystems.php`, Spatie Media Library in `config/media-library.php`.
  - Auth: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, `AWS_ENDPOINT`.

**Email Providers (driver-selectable):**
- SMTP/log transport by default with optional SES/Postmark/Resend mailers.
  - SDK/Client: Laravel mail transports in `config/mail.php` and credentials map in `config/services.php`.
  - Auth: `MAIL_*`, plus provider keys such as `AWS_*`, `POSTMARK_API_KEY`, `RESEND_API_KEY`.

## Data Storage

**Databases:**
- PostgreSQL (primary app database) with PostGIS extension for route geometry.
  - Connection: `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `config/database.php`.
  - Client: Laravel Eloquent/query builder in `app/` + migrations in `database/migrations/`.
- PostgreSQL (PowerSync service data + storage) via service URIs.
  - Connection: `POWERSYNC_DATA_SOURCE_URI`, `POWERSYNC_STORAGE_SOURCE_URI` in `compose.yaml` and `docker/powersync/service.yaml`.
  - Client: PowerSync service process (`journeyapps/powersync-service`) in `compose.yaml`.
- Browser local database (offline client state):
  - Connection: browser persistent DB filename in `resources/js/powersync/app-powersync.runtime.ts`.
  - Client: `@journeyapps/wa-sqlite` + `@powersync/web`.

**File Storage:**
- Local filesystem + public disk enabled by default (`config/filesystems.php`).
- S3 disk configured and used by media stack (`config/filesystems.php`, `config/media-library.php`).

**Caching:**
- Default cache driver: database (`config/cache.php`).
- Redis cache store available/configured (`config/cache.php`, `config/database.php`, `compose.yaml`).

## Authentication & Identity

**Auth Provider:**
- Custom Laravel auth using Sanctum (stateful cookie/session auth for SPA + API guards).
  - Implementation: `auth:sanctum` middleware on protected routes in `routes/api.php` and `routes/web.php`; Sanctum config in `config/sanctum.php`.

## Monitoring & Observability

**Error Tracking:**
- Sentry release creation integrated in CI build workflow.
  - Implementation: `.github/workflows/build.yml` (`getsentry/action-release@v1`).
- Runtime app-level error tracker service: Not detected.

**Logs:**
- Laravel Monolog channels (`single`, `daily`, optional `slack`, `papertrail`, etc.) configured in `config/logging.php`.
- Telescope installed for request/query/job inspection in `config/telescope.php`.

## CI/CD & Deployment

**Hosting:**
- Containerized deployment target using Docker image + compose orchestration (`Dockerfile`, `compose.prod.yaml`).

**CI Pipeline:**
- GitHub Actions for tests and static checks in `.github/workflows/test.yml`.
- GitHub Actions for production image build/push to GHCR in `.github/workflows/build.yml`.

## Environment Configuration

**Required env vars:**
- Core app/runtime: `APP_NAME`, `APP_ENV`, `APP_URL`, `APP_KEY`.
- Database: `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.
- Auth/session: `SANCTUM_STATEFUL_DOMAINS`, session-related `SESSION_*`.
- Sync: `POWERSYNC_PUBLIC_URL`, `POWERSYNC_JWT_*`, `POWERSYNC_DATA_SOURCE_URI`, `POWERSYNC_STORAGE_SOURCE_URI`.
- Cache/queue: `CACHE_STORE`, `QUEUE_CONNECTION`, `REDIS_*`.
- Media/storage: `FILESYSTEM_DISK`, `MEDIA_DISK`, `AWS_*`.
- Mail/logging: `MAIL_*`, `LOG_*`, optional third-party provider keys in `config/services.php`.

**Secrets location:**
- Local/deployed runtime secrets are environment-injected (expected from `.env` and container env files).
- CI secrets are injected through GitHub Actions secrets (`.github/workflows/build.yml`).

## Webhooks & Callbacks

**Incoming:**
- Not detected (no dedicated webhook receiver routes in `routes/api.php` or `routes/web.php`).

**Outgoing:**
- Not detected for business webhooks.
- Operational callbacks include optional Slack log channel/webhook (`config/logging.php`) and external mail transports (`config/mail.php`).

---

*Integration audit: 2026-04-30*

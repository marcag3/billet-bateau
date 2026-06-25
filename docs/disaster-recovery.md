# Disaster Recovery — PostgreSQL, PowerSync & Production Stack

Runbook for backing up and restoring Billet Bateau production data. Covers routine backups, PostgreSQL restore, and full server rebuild. Production runs under `deploy/` (`deploy/compose.yaml`).

## What to protect

| Asset | Location | Backup strategy | Loss impact |
| ----- | -------- | --------------- | ----------- |
| **Application database** | Postgres `pgsql` → `$DB_DATABASE` | `pg_dump` (below) | All programs, bookings, trips, etc. |
| **PowerSync bucket storage** | Postgres `pgsql` → `powersync_storage` | `pg_dump` (below) | Clients must full-resync; offline queues may conflict |
| **Postgres volume** | Docker volume `pgsql` | Logical dump preferred over raw volume copy | Same as both DBs above |
| **Object storage (media)** | Cloudflare R2 (`AWS_*` in `deploy/.env`) | R2 versioning / lifecycle / bucket replication (outside this app) | Missing product images, uploads |
| **Secrets & config** | `deploy/.env` | Secure off-host copy (password manager, encrypted backup) | Cannot decrypt sessions (`APP_KEY`), auth/sync breaks (`POWERSYNC_JWT_SECRET`) |
| **Redis** | Docker volume `redis` | Usually **not** backed up | Ephemeral cache/queues; safe to rebuild empty |
| **Application image** | `PRODUCTION_IMAGE` (GHCR) | Pulled from registry | Redeploy from CI |

Postgres image: `postgis/postgis:18-3.6` with logical replication enabled for PowerSync.

## Prerequisites

- Commands run from the compose project directory (e.g. `/srv/docker/billet-bateau-staging` or your production path).
- `deploy/.env` present with at least:

```env
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
```

- `pgsql` service healthy: `docker compose ps`.
- For piped dump/restore, **always use `-T`** on `docker compose exec` (TTY corrupts binary dump streams).

## Databases

| Database | Name source |
| -------- | ----------- |
| Application | `$DB_DATABASE` |
| PowerSync storage | `powersync_storage` (hardcoded) |

Both must be backed up and restored together for a coherent recovery (see [Consistency](#consistency) below).

---

## Routine backups

Run during low traffic or after pausing writes (see [Consistency](#consistency)). Store dumps off-host with timestamped names.

### 1. Load environment

```bash
cd /path/to/deploy
set -a && source .env && set +a
BACKUP_DIR="./backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
```

### 2. Dump both databases

```bash
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  pg_dump -U "$DB_USERNAME" -Fc -d "$DB_DATABASE" \
  > "$BACKUP_DIR/${DB_DATABASE}.dump"

docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  pg_dump -U "$DB_USERNAME" -Fc -d powersync_storage \
  > "$BACKUP_DIR/powersync_storage.dump"
```

Optional — globals (roles, grants) if you rely on custom roles beyond the bootstrap script:

```bash
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  pg_dumpall -U "$DB_USERNAME" --globals-only \
  > "$BACKUP_DIR/globals.sql"
```

### 3. Backup checklist

- [ ] Both `.dump` files created and non-zero size
- [ ] Copy `deploy/.env` to secure storage (same backup set)
- [ ] Confirm R2 bucket has its own retention/replication policy for media
- [ ] Record `PRODUCTION_IMAGE` tag in use (`docker compose images production`)

---

## Restore from backup files

Use when rebuilding Postgres or recovering from data loss. Target is the `pgsql` service in the current compose project.

### 1. Stop writers

```bash
docker compose stop production production-queue production-schedule powersync
```

### 2. Load environment

```bash
set -a && source .env && set +a
BACKUP_DIR=/path/to/backup-set   # directory containing *.dump files
```

### 3. Create databases (skip if they already exist)

On a **fresh** Postgres volume, the init script (`deploy/config/pgsql/create-powersync-user.sh`) creates `powersync_storage` and the `powersync` role. On an empty logical state without that init, create DBs manually:

```bash
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql createdb -U "$DB_USERNAME" "$DB_DATABASE"
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql createdb -U "$DB_USERNAME" powersync_storage
```

If restoring globals first (custom roles):

```bash
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  psql -U "$DB_USERNAME" -d postgres < "$BACKUP_DIR/globals.sql"
```

### 4. Restore dumps

```bash
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  pg_restore -U "$DB_USERNAME" -d "$DB_DATABASE" --no-owner --clean --if-exists \
  < "$BACKUP_DIR/${DB_DATABASE}.dump"

docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  pg_restore -U "$DB_USERNAME" -d powersync_storage --no-owner --clean --if-exists \
  < "$BACKUP_DIR/powersync_storage.dump"
```

### 5. Bring stack back

```bash
docker compose up -d
docker compose exec production php artisan migrate --force
docker compose restart powersync
```

`migrate --force` applies any migrations newer than the backup. If the backup is **ahead** of the deployed image schema, deploy the matching image before migrating.

### 6. Verify

```bash
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  psql -U "$DB_USERNAME" -d "$DB_DATABASE" -c "\dt"
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  psql -U "$DB_USERNAME" -d "$DB_DATABASE" -c "SELECT postgis_version();"
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql \
  psql -U "$DB_USERNAME" -d powersync_storage -c "\dt"
curl -fsS "${APP_URL}/up"
```

Smoke-test: log in, open a program, confirm PowerSync connects and data appears. Clients with stale local DBs should clear site data or reinstall the PWA if sync conflicts appear.

---

## Migrate between Postgres containers

Same-version logical migration (e.g. `old_pgsql` → `pgsql`) when both run in one compose project. No major-version upgrade steps — both should use `postgis/postgis:18-3.6`.

Assumes `DB_USERNAME` / `DB_PASSWORD` are shared between source and target; use separate credential variables if not.

```bash
set -a && source .env && set +a

# Create target DBs (skip existing)
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql createdb -U "$DB_USERNAME" "$DB_DATABASE"
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql createdb -U "$DB_USERNAME" powersync_storage

# Pipe dump → restore
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" old_pgsql pg_dump -U "$DB_USERNAME" -Fc -d "$DB_DATABASE" \
  | docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql pg_restore -U "$DB_USERNAME" -d "$DB_DATABASE" --no-owner --clean --if-exists

docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" old_pgsql pg_dump -U "$DB_USERNAME" -Fc -d powersync_storage \
  | docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql pg_restore -U "$DB_USERNAME" -d powersync_storage --no-owner --clean --if-exists
```

Optional globals (before creating DBs):

```bash
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" old_pgsql pg_dumpall -U "$DB_USERNAME" --globals-only \
  | docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" pgsql psql -U "$DB_USERNAME" -d postgres
```

After cutover: point the app at `pgsql`, restart services, decommission `old_pgsql`.

---

## Full server disaster recovery

Rebuild from scratch on a new host when the server, volume, or region is lost.

### 1. Provision host

- Docker + Compose
- DNS for `APP_URL`, `POWERSYNC_PUBLIC_URL`, R2 public domain

### 2. Restore configuration

```bash
git clone <repo> /opt/billet-bateau   # or copy deploy/ tree only
cd /opt/billet-bateau/deploy
cp /secure/backup/.env .env           # must include same APP_KEY and POWERSYNC_JWT_SECRET
mkdir -p config/pgsql
cp config/pgsql/create-powersync-user.sh config/pgsql/   # required on first empty volume
```

### 3. Start infrastructure

```bash
docker compose pull
docker compose up -d pgsql redis
# Wait for pgsql healthy
```

### 4. Restore PostgreSQL

Follow [Restore from backup files](#restore-from-backup-files) steps 2–5.

### 5. Start application tier

```bash
docker compose up -d
docker compose exec production php artisan migrate --force
```

### 6. Object storage

R2 bucket and credentials should already exist. If the bucket was lost, restore from R2 backup/replica and ensure `AWS_URL` / CORS still match the SPA origin. Run `php artisan storage:configure` only when **creating** a new bucket (dev RustFS pattern; production R2 is configured in the Cloudflare dashboard).

### 7. Validate

- `GET /up` healthy
- Public catalog loads; media URLs resolve
- Staff login + PowerSync sync
- Test booking email (Resend)

---

## Consistency

- Each `pg_dump` is an internally consistent MVCC snapshot of **one** database.
- The two dumps (`$DB_DATABASE` and `powersync_storage`) are **not** a single atomic snapshot. Pause writes (stop app + PowerSync) before backup or restore if cross-database consistency matters.
- Redis and in-flight queue jobs are not captured; expect at-most-once job retries after recovery.
- Offline PWA clients may upload changes made during the outage — reconcile conflicts manually if needed.

## Notes & gotchas

- **`-T` is mandatory** on both sides of any `docker compose exec` pipe.
- **`-Fc` (custom format)** is required for `pg_restore` and supports `--clean` / parallel restore.
- **`--no-owner`** avoids ownership errors when restoring under different roles.
- **`--clean --if-exists`** drops objects inside the target database; it does not drop/create the database itself.
- **`create-powersync-user.sh` runs only on first volume init.** After a logical restore into an existing volume, the `powersync` role and publication should already be in the dump or globals; re-run the script only if replication setup is missing.
- **Never change `APP_KEY` or `POWERSYNC_JWT_SECRET`** on restore unless you intend to invalidate all sessions and force client re-auth / resync.
- **Schema drift:** production DB is live — new migrations ship via CI. Backups are point-in-time; always run `migrate --force` after restore with an image at or above the backup’s migration level.
- **Major Postgres upgrades** are not covered here; use `pg_upgrade` or dump/restore across versions with a planned maintenance window.

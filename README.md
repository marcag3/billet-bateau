Local-first pwa based on tanstack-db + powersync. Using quasar.dev components and laravel backend.
Optimistic update.

## Deployment

Production is deployed with Docker Compose under `deploy/` (`deploy/compose.yaml`, `deploy/.env.example`). Schema changes use **new** Laravel migrations (`php artisan make:migration`); do not edit migrations that have already run in production.

`deploy/compose.yaml` bind-mounts `./config` (Garage, Postgres init, PowerSync, PostGIS schema). That tree is maintained on the [`staging` branch](https://github.com/marcag3/billet-bateau/tree/staging/deploy/config) — download it on the server before `docker compose up`.

From your `deploy/` directory (creates or replaces `deploy/config/`):

```bash
# Option A — Subversion export (single folder, no full clone)
svn export https://github.com/marcag3/billet-bateau/branches/staging/deploy/config config

# Option B — Tarball (needs curl; run from repo root, not inside deploy/)
curl -fsSL https://codeload.github.com/marcag3/billet-bateau/tar.gz/refs/heads/staging \
  | tar -xz billet-bateau-staging/deploy/config
mv billet-bateau-staging/deploy/config deploy/config
rm -rf billet-bateau-staging
```

Then copy `deploy/.env.example` → `deploy/.env`, set `PRODUCTION_IMAGE` and the variables in [Configuration](#configuration), and generate secrets where needed:

```bash
openssl rand -hex 16      # e.g. Garage / AWS key material
openssl rand -base64 48   # e.g. POWERSYNC_JWT_SECRET
```

Deploy: `cd deploy && docker compose pull && docker compose up -d`, then `docker compose exec production php artisan migrate --force` and `storage:configure` (see `deploy/.env.example`).

### CI (`.github/workflows/build.yml`)

On pushes to `main`, the workflow builds the production image (Vue source maps upload when `SENTRY_UPLOAD=true`), then creates a Sentry release in **both** projects using the commit SHA. Configure these repository secrets:

| Secret                   | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `SENTRY_AUTH_TOKEN`      | Org auth token (`Release` + `Project` write)     |
| `SENTRY_ORG`             | Organization slug                                |
| `SENTRY_LARAVEL_PROJECT` | Laravel project slug                             |
| `SENTRY_VUE_PROJECT`     | Vue project slug                                 |
| `VITE_SENTRY_DSN`        | Vue SDK DSN (baked into the image at build time) |

`SENTRY_RELEASE` / `VITE_SENTRY_RELEASE` are set to `${{ github.sha }}` in the image; set `SENTRY_LARAVEL_DSN` in `deploy/.env` on the server.

## Configuration

Environment files should contain **secrets** and **values that differ per environment** (URLs, domains, credentials). Everything else uses defaults from `config/*.php` or is injected by Docker Compose.

Copy `.env.example` → `.env` for local Sail dev. Copy `deploy/.env.example` → `deploy/.env` for production. Run `php artisan key:generate` after creating `.env`.

### Required

| Variable                   | Dev | Production | Notes                                                 |
| -------------------------- | --- | ---------- | ----------------------------------------------------- |
| `APP_KEY`                  | ✓   | ✓          | `php artisan key:generate`                            |
| `DB_DATABASE`              | ✓   | ✓          | Also used by Postgres container                       |
| `DB_USERNAME`              | ✓   | ✓          | Also used by Postgres container                       |
| `DB_PASSWORD`              | ✓   | ✓          | Also used by Postgres container                       |
| `AWS_ACCESS_KEY_ID`        | ✓   | ✓          | Garage S3 access key (≥ 8 chars in dev)               |
| `AWS_SECRET_ACCESS_KEY`    | ✓   | ✓          | Garage S3 secret key                                  |
| `AWS_URL`                  | ✓   | ✓          | Browser-facing public object URL base (Garage s3_web) |
| `AWS_ENDPOINT_PUBLIC`      | ✓   | ✓          | Browser-facing S3 API host for presigned uploads      |
| `PRODUCTION_IMAGE`         |     | ✓          | Container image tag (`deploy/.env` only)              |
| `APP_URL`                  |     | ✓          | Public app URL (HTTPS)                                |
| `SANCTUM_STATEFUL_DOMAINS` |     | ✓          | SPA host(s) for cookie auth, comma-separated          |
| `POWERSYNC_PUBLIC_URL`     |     | ✓          | Browser-reachable PowerSync URL                       |
| `POWERSYNC_JWT_SECRET`     |     | ✓          | HS256 secret; must match PowerSync service config     |
| `MAIL_HOST`                |     | ✓          | SMTP host for booking confirmation emails             |

### Injected by Docker Compose

These are set in `compose.yaml` / `deploy/compose.yaml` and usually do not belong in `.env`:

| Variable                                  | Dev (`laravel.test`)        | Production (`production`\*)             |
| ----------------------------------------- | --------------------------- | --------------------------------------- |
| `DB_HOST`                                 | `pgsql`                     | `pgsql`                                 |
| `REDIS_HOST`                              | `redis`                     | `redis`                                 |
| `AWS_ENDPOINT`                            | `http://garage:3900`        | — (default in `config/filesystems.php`) |
| `MAIL_MAILER` / `MAIL_HOST` / `MAIL_PORT` | `smtp` / `mailpit` / `1025` | —                                       |

\*Also applied to `production-schedule` and `production-queue`.

PowerSync Postgres URIs default in compose from `DB_*` (`POWERSYNC_DATA_SOURCE_URI`, `POWERSYNC_STORAGE_SOURCE_URI`).

### Optional overrides

| Variable                       | Default                                    | Config                   |
| ------------------------------ | ------------------------------------------ | ------------------------ |
| `APP_NAME`                     | `Laravel`                                  | `config/app.php`         |
| `APP_ENV`                      | `production`                               | `config/app.php`         |
| `APP_DEBUG`                    | `false`                                    | `config/app.php`         |
| `APP_URL`                      | `http://localhost`                         | `config/app.php`         |
| `DB_CONNECTION`                | `pgsql`                                    | `config/database.php`    |
| `DB_HOST`                      | `127.0.0.1`                                | `config/database.php`    |
| `DB_PORT`                      | `5432`                                     | `config/database.php`    |
| `SESSION_DRIVER`               | `redis`                                    | `config/session.php`     |
| `QUEUE_CONNECTION`             | `redis`                                    | `config/queue.php`       |
| `CACHE_STORE`                  | `redis`                                    | `config/cache.php`       |
| `FILESYSTEM_DISK`              | `s3`                                       | `config/filesystems.php` |
| `REDIS_HOST`                   | `127.0.0.1`                                | `config/database.php`    |
| `AWS_DEFAULT_REGION`           | `garage`                                   | `config/filesystems.php` |
| `AWS_BUCKET`                   | `app`                                      | `config/filesystems.php` |
| `AWS_USE_PATH_STYLE_ENDPOINT`  | `true`                                     | `config/filesystems.php` |
| `AWS_CORS_ALLOWED_ORIGINS`     | `*`                                        | `config/filesystems.php` |
| `POWERSYNC_PUBLIC_URL`         | `http://localhost:6080`                    | `config/powersync.php`   |
| `POWERSYNC_JWT_SECRET`         | local dev placeholder                      | `config/powersync.php`   |
| `POWERSYNC_JWT_KID`            | `local-dev`                                | `config/powersync.php`   |
| `POWERSYNC_JWT_AUDIENCE`       | `powersync-dev`                            | `config/powersync.php`   |
| `SANCTUM_STATEFUL_DOMAINS`     | localhost + current host                   | `config/sanctum.php`     |
| `MAIL_MAILER`                  | `log`                                      | `config/mail.php`        |
| `MAIL_FROM_ADDRESS`            | `hello@example.com`                        | `config/mail.php`        |
| `SENTRY_LARAVEL_DSN`           | — (disabled)                               | `config/sentry.php`      |
| `SENTRY_RELEASE`               | baked into production image (`github.sha`) | `config/sentry.php`      |
| `SENTRY_ENVIRONMENT`           | `production` in image                      | `config/sentry.php`      |
| `SENTRY_TRACES_SAMPLE_RATE`    | —                                          | `config/sentry.php`      |
| `VITE_SENTRY_DSN`              | — (disabled)                               | `resources/js/sentry.ts` |
| `VITE_SENTRY_RELEASE`          | baked into production image (`github.sha`) | `resources/js/sentry.ts` |
| `VITE_SENTRY_SEND_DEFAULT_PII` | `true`                                     | `resources/js/sentry.ts` |
| `VITE_OBJECT_STORAGE_ORIGINS`  | falls back to `AWS_URL`                    | `vite.config.ts`         |

### Compose-only (not Laravel)

Used by root `compose.yaml` for port forwarding and Sail; optional in a root `.env`:

| Variable                         | Default |
| -------------------------------- | ------- |
| `APP_PORT`                       | `80`    |
| `VITE_PORT`                      | `5173`  |
| `FORWARD_DB_PORT`                | `5432`  |
| `FORWARD_REDIS_PORT`             | `6379`  |
| `FORWARD_POWERSYNC_PORT`         | `6080`  |
| `FORWARD_GARAGE_PORT`            | `9000`  |
| `FORWARD_GARAGE_WEB_PORT`        | `8900`  |
| `FORWARD_MAILPIT_PORT`           | `1025`  |
| `FORWARD_MAILPIT_DASHBOARD_PORT` | `8025`  |
| `WWWUSER` / `WWWGROUP`           | `1000`  |

After production deploy, run `php artisan storage:configure` to apply `AWS_CORS_ALLOWED_ORIGINS` to Garage.

Local tests use `DB_DATABASE=testing` (see `phpunit.xml`). The testing database is created by `deploy/config/pgsql/create-testing-databases.sql`; run `CREATE EXTENSION postgis;` there if geometry tests fail.

## Program admin contexts (edit, control, checkin)

After a program is selected, staff work is split into **three contexts**. Each context is a separate route subtree under `/programs/:programId/` with its own **context layout** component in `resources/js/layouts/` (`AppProgramEditContextLayout.vue`, `AppProgramControlContextLayout.vue`, `AppProgramCheckinContextLayout.vue`). Those wrappers own **defaults** for shell behavior in that area—navigation grouping, header mode, program-switch rules—so `AppLayout.vue` stays a thin shell and child routes inherit context-level intent instead of repeating the same route meta everywhere.

| Context     | URL segment               | Purpose                                                                                                                                    |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Edit**    | `edit-context/`           | Program configuration and catalog: boats, boat types, water routes, trips, reports, settings, and program metadata at `edit-context/edit`. |
| **Control** | `control-context/control` | Program **control panel**: operations-facing entry for that program.                                                                       |
| **Checkin** | `checkin-context/checkin` | **Check-in manager** for the program (bookings / manifest workflows scoped to the program).                                                |

Program shell policy for the app chrome (e.g. in-place program switching) is set by the active context layout via the `appLayout` Pinia store while that layout is mounted, not from route meta. Add new pages under the context whose UX belongs with that group; use per-page overrides only when a single screen genuinely differs from its context defaults.

- Public booking **confirmation email** (French copy) sent to `contact_email` after successful `POST …/bookings` (`BookingConfirmationNotification`)
- Public program routes require **`is_active`** and in-season `end_date` (slug show + booking endpoints); guest `store` authorized via `BookingPolicy::createPublic`
- PHPUnit: PostGIS geometry + relations (`OnWaterDataModelTest`); PowerSync upload coverage (programs, boats, trips/water routes, template stack, ticket types / booking tickets); `PublicProgramApiTest`, `PublicBookingApiTest`, `BookingPolicyTest`

### Checkout

- Extend custom questions from current **program-level JSON questions** to richer admin authoring (program/trip scope) and stricter validation rules

### Trips and calendar

- Trips as **concrete** bookable rows with `**scheduled_departure_at`**, capacity, `program_id`, `**boat_type_id**`, `**water_route_id**`, optional `**template_day_slot_id**` (snapshot / provenance only after creation)
- **Template days** help staff create trips faster; editing or deleting a template does **not** change existing trips. To replace departures for a day, use **Clear unbooked trips (day)** on the trip calendar (issues one PowerSync `DELETE` per unbooked trip; booked trips stay) or delete trips individually
- **Day grouping** for that action follows the **calendar grid** (local date of `scheduled_departure_at` as shown), not a separate server “service date” API
- Trip calendar (week/day/month) + quick create from empty slots; click events to edit

### Backend — on-water data model

- PostGIS + Magellan in Docker/CI; `water_routes`: `name`, `trace` (LineString), `duration_minutes` — reusable rows
- `boats`; `**trips`** with planned route + boat type
- `**voyages**` table (+ `**user_id**` on row today), `**voyage_boat**`, `**guides**`, `**voyage_guide**`, `**check_ins**`, `**passengers**` — migrations, factories, Eloquent relations (`OnWaterDataModelTest` covers core geometry/trip/voyage/passenger shapes)
- Voyages **runtime**: HTTP actions (`startVoyage`, `markArrived`), ETA helpers, and aligning `**passengers`** with ticket types for manifests

### API and state

- Thin policies / gates in practice: public catalog **without** auth; PowerSync upload **requires** Sanctum user; upload actions assert **program membership** (`userCanManage`) on mutated rows (including `ticket_types` and `booking_tickets`)
- Formal policy coverage surface matching every route/resource if you want everything routed through Laravel policies consistently
- `startVoyage`: idempotent; `underway`; persist boats + guides; ETA from `**trips.scheduled_departure_at`** or ad-hoc `**voyages.scheduled_departure_at**` + `**water_routes.duration_minutes**` on `**voyages.water_route_id**`
- `markArrived` / complete; status transitions (`draft`  `ready`  `underway`  `completed`  `cancelled` — tune names)
- Audit: who started / closed the voyage

### PowerSync and admin client

- **Synced today** (program scope in `deploy/config/powersync/sync-config.yaml`): programs (user scope list), `boat_types`, `media`, `boat_program`, `boats`, `trips`, `water_routes`, `template_days` / `template_day_slots` / `template_day_dates`, `ticket_types`, `bookings` (subset: id, program_id, trip_id, contact fields), `booking_tickets` (joined through `bookings`)
- **Uplink** for those tables via `POST /api/powersync/upload` (`PowerSyncUploadRouter`) — **excluding** parent `bookings` (headers) for now
- Sync / uplink for `**bookings`** writes, `**voyages**`, `**guides**` (if edited offline), `**check_ins**`, `**passengers**`, operational pivots — required for field ops + check-in offline
- Conflict rules (single-writer per voyage, queue retries, …) documented and enforced beyond best-effort FIFO batches
- TanStack DB: optimistic voyage lifecycle + reconcile on reconnect; document offline-allowed vs forbidden actions

### Admin UI (Quasar)

- Edit context: boats, boat types, water routes (textarea trace), trips CRUD, program edit, settings placeholder, reports placeholder
- **Parcours** map editor: draw LineString on a map (optional upgrade from GeoJSON textarea)
- Control context: ops board (today: **placeholder** `AppProgramControlPanelPage`)
- Start **départ** modal: multi boats, multi guides, notes
- Check-in context: manifest workflows (today: **placeholder** `AppProgramCheckinManagerPage`)
- Ticket types screens (sync-ready models exist without pages)

### Fleet and sequencing notes

- Boat types / hulls CRUD + sync
- Guides: tables exist; **no** admin UI or PowerSync sync yet
- Optional: **Voyage** with `trip_id` null for field tests; end-to-end with bookings + check-in

### Testing

- PostGIS in CI; upload/trip/water route/template/ticket + booking ticket feature tests (`PowerSyncUploadTicketTypeBookingTicketTest` and sibling `PowerSyncUpload*` tests)
- PHPUnit: voyage **lifecycle** HTTP API, ETA = departure + **voyage** route duration, policy matrix if expanded
- Feature tests: `startVoyage` with N boats and M guides

### Cross-cutting

- Partial French strings for **Sortie** / **Parcours** (trips & water routes lists) in `resources/js/utilities/i18n.ts`
- French-first pass for **Départ** / **Embarcation** / control & check-in placeholders and remaining screens

### Later

- Weekly schedule: start/end date; template days or individual trips
- Overrides: e.g. holidays with template days
- Extras: electronic ticket, thank-you email, advanced settings

## Naming notes

- **Database:** all **table** and **column** names are **English** (`snake_case`). French product words (*Sortie*, *Parcours*, *Départ*, …) appear in **UI and i18n only**, never as SQL identifiers.
- Use **Program** as the main container term (instead of campaign).
- A Program can represent a season or a special event.
- Keep **Trip** as the bookable unit under a Program.
- Program names are user-defined and should not be constrained by a code-level naming pattern.
- Typical user naming combines a base/origin context with a season/date context.
- **WaterRoute** = geographic path (model / `water_routes` table; aligns with *route* in **GTFS**, but a distinct name avoids clashing with Laravel’s `Route` and facades). Rows are **reusable** across trips; `**scheduled_departure_at`** lives on `**trips**` (and on `**voyages**` only when `trip_id` is null). Every `**voyages**` row has a required `**water_route_id**` (actual run); it may differ from `**trips.water_route_id**` (planned).
- **Voyage** = on-water execution; **Trip** = what you book; hull assignment happens **at voyage start**, not at booking.
- **Manifest** table `**passengers`** + model `**Passenger**`: one **row per person** on the `**voyages`** row.
- **French (primary) product terminology** (below) is the **locked** mapping from code to user-facing copy.

## French (primary) product terminology

UI, marketing, and support copy are **French-first**. **Models, PHP, SQL tables, and SQL columns** use **English** identifiers only. **i18n keys and user-visible strings** use French (second column is the usual Fr label).


| Code (model) | Typical Fr (i18n)        |
| ------------ | ------------------------ |
| `Boat`       | **Embarcation**          |
| `BoatType`   | **Type d'embarcation**   |
| `WaterRoute` | **Parcours**             |
| `Voyage`     | **Départ**               |
| `Trip`       | **Sortie**               |
| `Passenger`  | *(French label in i18n)* |


*Examples:* "Démarrer le départ", "Sorties du jour", "Nouveau parcours", "Sélectionner l'embarcation".

---

## Ticket types & dependency ratio (boat trips)

Companion rules (e.g. “at most **2 children per 1 adult**”) are configured **per ticket type** on `ticket_types`, not with hard-coded adult/child labels or title guessing.

### Configuration (admin / PowerSync)

Each ticket type may optionally depend on another type in the **same program**:

| Column | Meaning |
| ------ | ------- |
| `depends_on_ticket_type_id` | Reference (anchor) ticket type ULID, or `null` if no dependency |
| `max_per_reference_ticket` | Max **dependent** tickets allowed per **one** reference ticket in the cart |

**Invariants when authoring:**

- Both fields are set together, or both are `null`.
- A type cannot depend on itself.
- When set, `max_per_reference_ticket >= 1`.
- Reference options are other types in the same program (admin UI excludes the current type in edit mode).

Example: configure **Child** with `depends_on_ticket_type_id` → Adult id and `max_per_reference_ticket` = `2` → up to 2 child tickets per 1 adult in one booking.

### Checkout validation (public booking)

Quantities are validated on the **whole booking** for the selected trip (same order, same date). Build a quantity map from `ticket_quantities` and each selected type’s options (including dependency fields from `GET` booking options).

For every ticket type with dependency fields set:

1. Let `reference_qty` = quantity of `depends_on_ticket_type_id` (0 if not in cart).
2. Let `dependent_qty` = quantity of the dependent type.
3. If `reference_qty === 0`, then `dependent_qty` must be `0`.
4. Otherwise: **`dependent_qty <= reference_qty × max_per_reference_ticket`**.

Reject with a clear error on `ticket_quantities.{dependent_type_id}` when the rule fails.

**Enforcement layers:**

- **Frontend:** `resources/js/utilities/public-booking-validation.ts` (`validatePublicBookingTickets`) — pre-submit, mirrors the rules above.
- **Backend:** `app/Actions/CreatePublicBookingAction.php` — authoritative re-check on `POST` public booking.

No separate `numerator` / `denominator` columns; ratios are expressed only through reference type + max-per-reference.

---

# On-water operations (WaterRoute, Trip, Voyage, ops board)

> **UI (Fr):** see **French (primary) product terminology** — *Parcours* · *Sortie* · *Départ* · *Embarcation* / *Type d'embarcation*. `**Passenger`** / `**passengers**` stay English in SQL; French strings live in i18n.

> **Naming:** the geographic entity matches *route* in **GTFS** semantically, but the codebase uses `**WaterRoute`** and table `**water_routes**` (and `water_route_id` FKs) to avoid clashing with Laravel’s `Route` and routing.

> **Domain terms** (code)
>
> - **WaterRoute** — `water_routes`: reusable geometry; columns include `name`, `trace` (PostGIS + [Magellan](https://github.com/MatanYadaev/laravel-magellan) `LineString`), `**duration_minutes`** (no departure columns on this table). Authoring: map in admin. **UI:** *Parcours*.
> - **Trip** — `trips`: `program_id`, `boat_type_id`, planned `water_route_id`, `**scheduled_departure_at`**, capacity, etc. **UI:** *Sortie*.
> - **Voyage** — `voyages`: optional `trip_id`; required `water_route_id` (actual path; may differ from `trips.water_route_id`); `started_at`, `arrived_at`, `status`; optional `scheduled_departure_at` when `trip_id` is null. Boats via `voyage_boat`; guides via `voyage_guide`. **UI:** *Départ*.

## Locked product decisions (v1)

- **Staff / admin access:** v1 has **no user roles** (no super-admin vs guide vs read-only, etc.). **Any** authenticated back-office user may perform **all** admin operations. Policies and tests should only distinguish **guest vs authenticated** staff, not role tiers. `**POST /api/powersync/upload` follows the same rule** (no owner-only mutation gates for staff-managed synced rows such as programs, boat types, boats, addresses).
- **Voyage ↔ boats:** multiple hulls per voyage is **common** — `voyage_boat` (or similar pivot), not a single `boat_id`.
- **Voyage ↔ trip:** `trip_id` nullable; a voyage is linked to zero or one bookable trip.
- **Voyage ↔ water route:** `**water_route_id` is required** on every voyage — records the **actual** path/duration for that run; staff may pick a route different from the trip’s planned `water_route_id`.
- **Check-in:** **one check-in per booking (family = one booking)** — attaches the booking to a **voyage**. **Manifest** is table `**passengers`**: **one row per person** on the boat (everyone counted that way, including walk-ons and corrections vs sold tickets).
- **Payment:** **out of scope for v1** (simplifies booking; voyages and ops are still the core).
- **Start:** only **human** “start voyage” — no automatic start from schedule.
- **ETA:** use `**trips.scheduled_departure_at`** when `trip_id` is set, else `**voyages.scheduled_departure_at**`; add `**water_routes.duration_minutes**` for `**voyages.water_route_id**` (not necessarily the trip’s planned `water_route_id`; no live GPS in v1).
- **Admin UI:** **Quasar** — **public** bundle and **admin** bundle; the **admin bundle must work offline** (PowerSync: sync is **crucial** for operations data, not nice-to-have).

## Data model (backend) — step by step

1. **PostGIS + Magellan** in Docker/CI + PHP: enable `geometry` columns, migrations for `**water_routes`**: `name`, `trace` (`LineString`), `**duration_minutes**` (unsigned int or as you prefer) — **no** departure columns; rows are **reused** across `**trips`**.
2. `**boat_types**` — as today for trip catalog; **trips** reference `boat_type_id`, `**water_route_id`**, `**scheduled_departure_at**` (and capacity / calendar fields as you build the bookable model).
3. `**boats**` — as implemented: `boat_type_id`, optional `user_id` (audit/metadata only), `name`, optional `capacity`, `notes`, etc. Shared among staff, not user-isolated.
4. `**voyages**` — nullable `trip_id`, `**water_route_id` NOT NULL** (actual path for this row; may differ from `trips.water_route_id`), `started_at`, `arrived_at`, `status` (`draft`  `ready`  `underway`  `completed`  `cancelled` — tune names), optional `eta_cached_at`. Optional `**scheduled_departure_at`** only when `**trip_id**` is null; when `**trip_id**` is non-null, use `**trips.scheduled_departure_at**` for departure. **No** `boat_id` — use step 5.
5. `**voyage_boat`** — `voyage_id`, `boat_id` (and optional sort/`is_lead` if needed). Created/updated when staff **starts** the voyage (or edit before underway).
6. `**guides`** — e.g. `**display_name**`, `**email**`, `**phone**` (nullable as needed), nullable `**user_id**` (staff link).
7. `**voyage_guide**` (or order column on a pivot) — which guides for this voyage, set at start via **multi-select**.
8. **Check-in / manifest** — `check_ins`: one row per `**bookings`**, `voyage_id`, timestamps, optional `notes` / state. `**passengers**`: one row per person (`voyage_id`, e.g. `**display_name**`, optional `**booking_id**`, optional `**check_in_id**`, optional `**ticket_type_id**`, `**notes**`).
9. **Pax on board** — count / aggregate `**passengers`** for the voyage (by ticket type when available); keep consistent with **ticket types** (ratio rules) when booking exists.

## API & state machine

1. **Policies** — v1: any authenticated staff user may start/complete voyages and manage programs; use policies to reject **unauthenticated** access and for validation rules, not for staff role matrices.
2. **Transitions** — e.g. `startVoyage`: idempotent, sets `started_at`, status `underway`, persists boats + guides; recompute ETA from `**trips.scheduled_departure_at`** or `**voyages.scheduled_departure_at**`, plus `**water_routes.duration_minutes**` for `**voyages.water_route_id**` (v1: not `started_at`). `markArrived` → set `arrived_at`, `completed`.
3. **Audit** — who started / who closed the voyage, for support.

## PowerSync & offline (v1 = first-class)

1. **Tables to sync to admin clients** (minimum): `**water_routes`** (+ GeoJSON for map when online), `boats`, `boat_types`, `**trips**`, `voyages`, `voyage_boat`, `guides`, `voyage_guide`, `check_ins`, `**passengers**`, and anything the **bookings domain** needs for check-in. Define **uplink** (writes from device) and **conflict** rules (e.g. start voyage: single-writer per voyage, queue retries; or CRDT for counters — keep v1 **simple and explicit**).
2. **TanStack DB** in admin: optimistic start/arrive; reconcile when sync reconnects. Document which actions are **allowed offline** (e.g. start voyage offline → queue until server confirms) vs **forbidden** if you need server inventory checks.
3. **Map draw** for `**water_routes`** may require **online** authoring in v1, while **read** of trace works offline on the board after sync.

## Admin UI (Quasar, admin bundle)

1. **Water route editor** — draw `LineString` on map, set `**duration_minutes`**, `**name**`; save to API, syncs down.
2. **Ops board** — `voyages` with `status` in (ready/boarding, underway): trip/program label, `water_routes.name` for `**voyages.water_route_id`**, departure from `**trips.scheduled_departure_at**` or ad-hoc `**voyages.scheduled_departure_at**`, ETA + `**duration_minutes**`, headcount from `**passengers**`, boat and guide names, **Start voyage** / **Mark arrived**.
3. **Start voyage** modal — **multi-select boats** (filtered by trip’s `boat_type` or all of type), **multi-select guides**, optional notes; no payment step in v1.
4. **Check-in** — associating bookings to a **voyage** (`check_ins`); add/edit `**passengers`** (one row per person, including walk-ons); works **offline** per sync design.

## Testing

1. **PHPUnit** — voyage lifecycle, policy, **ETA = `scheduled_departure_at` + `duration_minutes`** (trip vs ad-hoc per rules above; `**voyages.water_route_id**` always set); PostGIS in CI. **Feature tests** for `startVoyage` with N boats and M guides.

## Order relative to the priority list above

- `**trips`** must expose `**boat_type_id**`, `**water_route_id**`, `**scheduled_departure_at**` before `**voyages.trip_id**` links are meaningful; every `**voyages**` row still needs `**water_route_id**` (UI may default to `trips.water_route_id`; ops may change). `**trip_id**` null: supply `**scheduled_departure_at**` + `**water_route_id**` on `**voyages**` for ETA.
- **Check-in** model depends on **bookings** existing (even without payment) — at least a booking + line items; **pax on board** comes from `**passengers`** rows.
- **Ticket dependency ratio** (configured on `ticket_types`) and displayed PAX should use the same ticket-type buckets, aligned **per `passengers` row** when types exist.
- **Water routes** (PostGIS) and **Voyage** CRUD can proceed in parallel with a minimal booking stub, then connect end-to-end.




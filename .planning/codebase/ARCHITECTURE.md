<!-- refreshed: 2026-04-30 -->
# Architecture

**Analysis Date:** 2026-04-30

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  Dual Vue SPA Frontends                     │
├──────────────────┬──────────────────┬───────────────────────┤
│  Admin SPA       │  Public SPA      │  Service Worker       │
│  `resources/js/  │  `resources/js/  │  `resources/js/       │
│  app.main.ts`    │  public.main.ts` │  service-worker/       │
│                  │                  │  app-sw.ts`            │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Laravel HTTP + API Layer                       │
│   `public/index.php` → `bootstrap/app.php` → `routes/*.php` │
│   Controllers: `app/Http/Controllers/**`                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain + Persistence                                        │
│  Eloquent: `app/Models/**`, DTOs: `app/Data/**`,            │
│  Actions: `app/Actions/**`, DB schema: `database/migrations` │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Laravel bootstrap | Configure routing, middleware, and exception pipeline | `bootstrap/app.php` |
| Web/API route layer | Map URL surfaces to controllers and middleware groups | `routes/web.php`, `routes/api.php` |
| Auth/session boundary | Sign-in/out, setup status, and current-session API | `app/Http/Controllers/Auth/SessionController.php`, `app/Http/Controllers/Auth/InstallController.php` |
| PowerSync ingress | Accept offline CRUD batch and route item-by-item to domain actions | `app/Http/Controllers/Api/PowerSyncUploadController.php`, `app/PowerSync/PowerSyncUploadRouter.php` |
| Domain mutation handlers | Apply per-entity upload semantics using DTO validation and Eloquent | `app/Actions/PowerSync/*.php` |
| Admin shell + routing | Load protected app shell and program-scoped route trees | `resources/js/app.main.ts`, `resources/js/router/index.ts` |
| Local-first data runtime | Bootstrap PowerSync DB, collections, stream subscriptions, and outbox status | `resources/js/powersync/app-powersync.runtime.ts` |
| Public catalog shell | Mount unauthenticated catalog routes and pages | `resources/js/public.main.ts`, `resources/js/router/public.ts` |

## Pattern Overview

**Overall:** Layered monolith with local-first sync edge.

**Key Characteristics:**
- Keep HTTP controllers thin and push mutation logic into dedicated action classes in `app/Actions/`.
- Route offline writes through one upload gateway (`/api/powersync/upload`) and dispatch by CRUD type.
- Model frontend state around PowerSync-backed TanStack collections, with Vue routes setting sync scope.

## Layers

**Delivery Layer (HTTP + SPA entrypoints):**
- Purpose: Accept browser requests and mount frontend applications.
- Location: `public/index.php`, `resources/views/app.blade.php`, `resources/views/public.blade.php`.
- Contains: Front controller, Blade shells, Vite entrypoint hooks.
- Depends on: Laravel bootstrap, Vite-generated assets.
- Used by: Browser clients (staff/admin and public users).

**Application Layer (Routing + Controllers + Middleware):**
- Purpose: Authenticate, authorize, and orchestrate request handling.
- Location: `routes/web.php`, `routes/api.php`, `app/Http/Controllers/**`, `app/Http/Middleware/EnsureApplicationIsInstalled.php`.
- Contains: Route groups, auth/session handlers, install flow, API endpoints.
- Depends on: Domain services/actions and policies.
- Used by: Web and API clients.

**Domain Layer (Actions + DTOs + Policies):**
- Purpose: Validate payloads and apply business rules for each entity mutation path.
- Location: `app/Actions/**`, `app/Data/**`, `app/Policies/**`, `app/PowerSync/**`.
- Contains: PowerSync CRUD dispatch, typed data payload objects, authorization logic.
- Depends on: Eloquent models and framework services.
- Used by: Controllers and router dispatchers.

**Persistence Layer (Models + Migrations + Factories):**
- Purpose: Persist relational and geospatial data, define entity relations.
- Location: `app/Models/**`, `database/migrations/**`, `database/factories/**`.
- Contains: ULID-backed models, scopes, casts, pivots, schema definitions.
- Depends on: PostgreSQL/PostGIS and configured Laravel DB drivers.
- Used by: Domain actions, controllers, and test suites.

**Frontend Local-First Layer (Vue + PowerSync runtime):**
- Purpose: Render UI, maintain local replicated state, and upload queued offline writes.
- Location: `resources/js/router/**`, `resources/js/pages/**`, `resources/js/models/**`, `resources/js/powersync/**`, `resources/js/services/**`.
- Contains: Route guards, Pinia stores, model definitions, PowerSync connector, fetch helpers.
- Depends on: Generated route helpers in `resources/js/routes/**`, API endpoints in Laravel.
- Used by: Staff users in `/app` shell and public users in `/`.

## Data Flow

### Primary Request Path

1. Browser request enters Laravel front controller and app bootstrap (`public/index.php:17`, `bootstrap/app.php:7`).
2. Route middleware and controller resolve request intent (`routes/api.php:22`, `app/Http/Controllers/Api/PowerSyncUploadController.php:22`).
3. Batch entries are validated and dispatched to per-type actions inside a transaction (`app/Http/Controllers/Api/PowerSyncUploadController.php:34`, `app/PowerSync/PowerSyncUploadRouter.php:22`).
4. Action applies entity mutation with DTO validation and Eloquent persistence (`app/Actions/PowerSync/ApplyProgramPowerSyncCrudAction.php:23`).
5. JSON response returns to client (`app/Http/Controllers/Api/PowerSyncUploadController.php:41`).

### Local-First Sync Cycle

1. Admin app mounts and initializes auth/store state (`resources/js/app.main.ts:53`, `resources/js/store/auth.store.ts:61`).
2. Router guard enforces auth/setup and sets program sync scope (`resources/js/router/index.ts:215`, `resources/js/router/index.ts:251`).
3. PowerSync runtime bootstraps local DB and table collections (`resources/js/powersync/app-powersync.runtime.ts:273`, `resources/js/powersync/app-powersync.runtime.ts:322`).
4. Connector fetches credentials and uploads CRUD batches to Laravel (`resources/js/services/powersync.connector.ts:9`, `resources/js/services/powersync.connector.ts:32`).
5. Backend applies CRUD batch and client marks batch complete (`app/Http/Controllers/Api/PowerSyncUploadController.php:35`, `resources/js/services/powersync.connector.ts:40`).

**State Management:**
- Server state is relational and transaction-based (Eloquent + DB transactions) in `app/Models/**` and controllers/actions.
- Client state is local-first via PowerSync collections and reactive refs in `resources/js/powersync/app-powersync.runtime.ts`.
- UI/session state uses Pinia stores (`resources/js/store/auth.store.ts`, `resources/js/store/app-layout.store.ts`).

## Key Abstractions

**PowerSync CRUD Router:**
- Purpose: Central type-based upload dispatch, one canonical mutation gateway.
- Examples: `app/PowerSync/PowerSyncUploadRouter.php`, `app/PowerSync/PowerSyncCrudType.php`.
- Pattern: `match`-based dispatch to single-purpose action classes.

**Action-per-entity mutation handler:**
- Purpose: Encapsulate per-entity PUT/PATCH/DELETE semantics and authorization.
- Examples: `app/Actions/PowerSync/ApplyProgramPowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyTripPowerSyncCrudAction.php`.
- Pattern: AsAction handlers with explicit operation branching and typed DTO validation.

**Program-scoped route contexts:**
- Purpose: Partition admin UX into edit/control/checkin subtrees with layout-level behavior.
- Examples: `resources/js/router/index.ts`, `resources/js/layouts/AppProgramEditContextLayout.vue`, `resources/js/layouts/AppProgramControlContextLayout.vue`, `resources/js/layouts/AppProgramCheckinContextLayout.vue`.
- Pattern: Nested route groups with shared meta and per-context layout wrappers.

**Frontend model definition contract:**
- Purpose: Standardize collection metadata and API contract expectations.
- Examples: `resources/js/models/model.definition.ts`, `resources/js/models/programs/programs.model.ts`.
- Pattern: `defineModel()` metadata + collection operations backed by PowerSync runtime refs.

## Entry Points

**Laravel Front Controller:**
- Location: `public/index.php`
- Triggers: Every HTTP request served by the PHP runtime.
- Responsibilities: Bootstrap app and delegate request handling.

**Application Bootstrap:**
- Location: `bootstrap/app.php`
- Triggers: Included from `public/index.php`.
- Responsibilities: Register routes, middleware, and exception configuration.

**Admin SPA Bootstrap:**
- Location: `resources/js/app.main.ts`
- Triggers: `@vite('resources/js/app.main.ts')` in `resources/views/app.blade.php`.
- Responsibilities: Initialize app plugins, auth state, model bootstrap, and service worker registration.

**Public SPA Bootstrap:**
- Location: `resources/js/public.main.ts`
- Triggers: `@vite('resources/js/public.main.ts')` in `resources/views/public.blade.php`.
- Responsibilities: Mount public route tree and shared UI plugins.

**Offline Upload Ingress:**
- Location: `app/Http/Controllers/Api/PowerSyncUploadController.php`
- Triggers: `POST /api/powersync/upload` from PowerSync connector.
- Responsibilities: Parse upload batch and apply each entry transactionally.

## Architectural Constraints

- **Threading:** PHP request lifecycle is synchronous per request; frontend uses browser single-threaded event loop with optional service worker and worker-based internals from PowerSync/WA-SQLite.
- **Global state:** Shared process-level state is minimal; frontend module refs (for example `powerSyncDbRef` and collection refs) are singleton-like in `resources/js/powersync/app-powersync.runtime.ts`.
- **Circular imports:** Not detected in explored files; route and model modules use one-directional imports.
- **Route generation coupling:** Frontend API calls rely on generated Wayfinder route modules in `resources/js/routes/**`; backend route signature changes must keep generated routes in sync.

## Anti-Patterns

### Bypassing PowerSync Upload Gateway

**What happens:** Adding table-specific REST write endpoints for entities already synced through PowerSync.
**Why it's wrong:** It creates dual write paths and diverging validation/authorization semantics relative to `POST /api/powersync/upload`.
**Do this instead:** Extend `PowerSyncCrudType` and `PowerSyncUploadRouter` with a dedicated `Apply*PowerSyncCrudAction` (`app/PowerSync/PowerSyncUploadRouter.php`, `app/Actions/PowerSync/*.php`).

### Putting Context Shell Rules on Individual Pages

**What happens:** Repeating app-shell behavior in page route meta or page components instead of context layouts.
**Why it's wrong:** It duplicates route policy logic and increases drift between edit/control/checkin contexts.
**Do this instead:** Keep context-level shell defaults in layout wrappers under `resources/js/layouts/` and route subtree definitions in `resources/js/router/index.ts`.

## Error Handling

**Strategy:** Fail fast with explicit HTTP responses plus typed validation boundaries.

**Patterns:**
- Controllers return explicit `401`, `409`, `423`, and validation errors (`app/Http/Controllers/Auth/SessionController.php`, `app/Http/Controllers/Auth/InstallController.php`).
- Frontend request wrapper normalizes JSON error handling and raises auth-expired events on `401` (`resources/js/services/http.client.ts`).

## Cross-Cutting Concerns

**Logging:** Standard Laravel logging pipeline via config (`config/logging.php`); frontend uses targeted `console.error` for bootstrap failures (`resources/js/app.main.ts`).
**Validation:** Request validation in controllers and DTO-based validation (`$request->validate(...)`, `Spatie Laravel Data validateAndCreate(...)`) across `app/Http/Controllers/**` and `app/Data/**`.
**Authentication:** Sanctum session auth plus route middleware groups in `routes/web.php` and `routes/api.php`; frontend auth state/refresh in `resources/js/store/auth.store.ts`.

---

*Architecture analysis: 2026-04-30*

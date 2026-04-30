# Codebase Structure

**Analysis Date:** 2026-04-30

## Directory Layout

```text
billet-bateau-new/
├── app/                      # Laravel domain/app code (controllers, models, actions, DTOs, policies)
├── bootstrap/                # Laravel bootstrap and provider registration
├── config/                   # Framework and integration configuration
├── database/                 # Migrations, factories, seeders
├── docker/                   # Local/CI service definitions (PowerSync, Postgres helpers, entrypoints)
├── public/                   # Web root and static assets
├── resources/                # Frontend SPA code, styles, Blade shells
├── routes/                   # HTTP and console route definitions
├── tests/                    # PHPUnit feature/unit tests
├── .github/workflows/        # CI workflows for build and test pipelines
├── composer.json             # PHP dependency and script manifest
├── package.json              # Node/Vite dependency and script manifest
└── vite.config.ts            # Frontend build + PWA config
```

## Directory Purposes

**`app/`:**
- Purpose: Primary Laravel application layer and domain logic.
- Contains: `Http/Controllers`, `Models`, `Actions`, `Data`, `PowerSync`, `Policies`, `Services`, `Rules`, `Enums`, `Providers`.
- Key files: `app/Http/Controllers/Api/PowerSyncUploadController.php`, `app/PowerSync/PowerSyncUploadRouter.php`, `app/Models/Program.php`.

**`resources/js/`:**
- Purpose: Vue admin/public SPA implementation and local-first data runtime.
- Contains: `router`, `pages`, `layouts`, `components`, `models`, `powersync`, `services`, `store`, generated `routes`, generated `actions`.
- Key files: `resources/js/app.main.ts`, `resources/js/public.main.ts`, `resources/js/router/index.ts`, `resources/js/powersync/app-powersync.runtime.ts`.

**`routes/`:**
- Purpose: Bind URL/endpoint surfaces to controller handlers and middleware.
- Contains: `web.php`, `api.php`, `console.php`.
- Key files: `routes/web.php`, `routes/api.php`.

**`database/`:**
- Purpose: Persisted schema and test data construction.
- Contains: `migrations`, `factories`, `seeders`.
- Key files: `database/migrations/2026_04_25_120002_create_trips_table.php`, `database/factories/ProgramFactory.php`.

**`tests/`:**
- Purpose: Validate backend behavior, policy rules, and PowerSync upload paths.
- Contains: Feature tests for auth, public API, media, and sync upload flows; unit tests.
- Key files: `tests/Feature/PowerSyncUploadProgramTest.php`, `tests/Feature/PublicProgramApiTest.php`, `tests/TestCase.php`.

**`docker/`:**
- Purpose: Service-level environment wiring for PowerSync/Postgres and startup helpers.
- Contains: `docker/powersync/sync-config.yaml`, `docker/powersync/service.yaml`, `docker/pgsql/*.sql`, `docker/entrypoint.d/*.sh`.
- Key files: `docker/powersync/sync-config.yaml`, `docker/pgsql/create-testing-databases.sql`.

## Key File Locations

**Entry Points:**
- `public/index.php`: Laravel front controller for all HTTP requests.
- `bootstrap/app.php`: Core app configuration and routing registration.
- `resources/js/app.main.ts`: Authenticated admin SPA bootstrap.
- `resources/js/public.main.ts`: Public catalog SPA bootstrap.

**Configuration:**
- `config/*.php`: Laravel runtime configuration.
- `vite.config.ts`: Frontend bundling, Wayfinder integration, PWA strategy.
- `eslint.config.js`: Frontend linting rules.
- `composer.json` and `package.json`: Dependency manifests and scripts.

**Core Logic:**
- `app/Actions/PowerSync/*.php`: Per-entity upload mutation handlers.
- `app/Data/PowerSync/**/*.php`: DTO validation/casts/resolvers for upload payloads.
- `app/Models/*.php`: Eloquent entities and relationships.
- `resources/js/models/**/*.ts`: Frontend domain model and collection access patterns.
- `resources/js/services/*.ts`: HTTP, PowerSync connector, queue helpers.

**Testing:**
- `tests/Feature/*.php`: HTTP/API and PowerSync integration behavior.
- `tests/Unit/*.php`: Focused unit checks.
- `resources/js/tests/**/*.test.ts`: Frontend Vitest coverage.

## Naming Conventions

**Files:**
- PHP classes: `PascalCase.php` under PSR-4 namespaces (for example `ProgramController.php`, `ApplyProgramPowerSyncCrudAction.php`).
- Vue components/pages/layouts: `PascalCase.vue` (for example `AppProgramEditPage.vue`, `PublicLayout.vue`).
- Frontend modules: mostly `kebab-case.ts` or dotted domain suffix style (for example `auth.store.ts`, `model.definition.ts`, `app-powersync.runtime.ts`).

**Directories:**
- Laravel domains are noun-based in `app/` (`Models`, `Actions`, `Data`, `Http`, `Policies`).
- Frontend domains are role-based in `resources/js/` (`pages`, `layouts`, `components`, `services`, `utilities`, `models`).

## Where to Add New Code

**New API-backed domain feature:**
- Primary code: add controller endpoint in `app/Http/Controllers/Api/`, DTO in `app/Data/`, and model/policy updates in `app/Models/` and `app/Policies/`.
- Routes: register in `routes/api.php` (or `routes/web.php` for browser shell endpoints).
- Tests: add feature coverage in `tests/Feature/`.

**New PowerSync-synced entity:**
- Backend ingest: add enum/type and router dispatch in `app/PowerSync/PowerSyncCrudType.php` and `app/PowerSync/PowerSyncUploadRouter.php`.
- Mutation logic: create `Apply<Entity>PowerSyncCrudAction` in `app/Actions/PowerSync/`.
- Payload typing: add DTOs/resolvers/casts under `app/Data/PowerSync/<Entity>/`.
- Frontend data: add schema/collection wiring in `resources/js/powersync/app.powersync-schema.ts` and `resources/js/powersync/app-powersync.runtime.ts`, then model facade in `resources/js/models/<entity>/`.

**New admin UI page/module:**
- Implementation: add page component in `resources/js/pages/` and route in the correct subtree in `resources/js/router/index.ts`.
- Shared shell behavior: place context-level behavior in `resources/js/layouts/` instead of page-local duplication.
- API route helpers: consume generated modules from `resources/js/routes/**` and `resources/js/actions/**`.

**New public-facing page:**
- Implementation: add route and page under `resources/js/router/public.ts` and `resources/js/pages/`.
- Data access: use `resources/js/services/publicApi.ts` or generated public route helpers under `resources/js/routes/api/public/`.

**Utilities:**
- Shared frontend helpers: `resources/js/utilities/`.
- Shared backend service logic: `app/Services/`.
- Reusable backend validation rules: `app/Rules/`.

## Special Directories

**`resources/js/routes/`:**
- Purpose: Generated typed route URL builders from backend routes.
- Generated: Yes.
- Committed: Yes.

**`resources/js/actions/`:**
- Purpose: Generated typed controller-action call definitions (Wayfinder bindings).
- Generated: Yes.
- Committed: Yes.

**`public/build/`:**
- Purpose: Compiled frontend assets.
- Generated: Yes.
- Committed: No (ignored build output).

**`.planning/codebase/`:**
- Purpose: GSD architectural/codebase mapping artifacts consumed by planning/execution flows.
- Generated: Yes (by mapper workflows).
- Committed: Yes when repository policy includes planning artifacts.

---

*Structure analysis: 2026-04-30*

---
name: migrate-to-sync-streams
overview: Migrate this app from PowerSync Sync Rules to Sync Streams while preserving current auth and upload behavior. Replication semantics follow the program/address refactor — user-scoped todos/programs, program-scoped media, and globally replicated addresses (see linked plan).
todos:
  - id: migrate-powersync-config
    content: Translate sync-rules into Streams config (todos/programs per user; full addresses to each user; media per program) and wire service/compose
    status: completed
  - id: verify-auth-contract
    content: Validate JWT claim and audience compatibility between Laravel issuer and Sync Streams service
    status: in_progress
  - id: reconcile-upload-contract
    content: Confirm or update backend/frontend upload payload contract for Streams
    status: pending
  - id: align-client-schema
    content: Adjust frontend PowerSync schema/runtime for any Streams-driven table or column differences
    status: pending
  - id: harden-tests
    content: Add/adjust focused PowerSync feature coverage for credentials, validation, and authorization isolation
    status: pending
isProject: false
---

# Sync Streams Migration Plan

## Scope and defaults

- Target the existing self-hosted PowerSync setup in this repo (Docker-based) and replace legacy Sync Rules usage.
- **Replication baseline** (aligned with program/address FK refactor — see program/address plan in Cursor plans): user-scoped **`todos`** and **`programs`** (including nullable **`programs.address_id`**); **`addresses`** replicated **in full to every authenticated user** (not filtered by owner); **`media`** remains **program-scoped** (same visibility as rows tied to the user’s programs). Upload API contract stays unless Streams forces changes.
- Keep this file updated whenever sync-rules or Streams-related table semantics change in the codebase.

## Current baseline to preserve

- PowerSync service currently loads Sync Rules from [`/home/mag/repo/billet-bateau-new/docker/powersync/sync-rules.yaml`](/home/mag/repo/billet-bateau-new/docker/powersync/sync-rules.yaml) via [`/home/mag/repo/billet-bateau-new/docker/powersync/service.yaml`](/home/mag/repo/billet-bateau-new/docker/powersync/service.yaml).
- Backend auth/upload contract is implemented in [`/home/mag/repo/billet-bateau-new/app/Services/PowerSyncTokenIssuer.php`](/home/mag/repo/billet-bateau-new/app/Services/PowerSyncTokenIssuer.php), [`/home/mag/repo/billet-bateau-new/app/Http/Controllers/Api/PowerSyncCredentialsController.php`](/home/mag/repo/billet-bateau-new/app/Http/Controllers/Api/PowerSyncCredentialsController.php), [`/home/mag/repo/billet-bateau-new/app/Http/Controllers/Api/PowerSyncUploadController.php`](/home/mag/repo/billet-bateau-new/app/Http/Controllers/Api/PowerSyncUploadController.php), and [`/home/mag/repo/billet-bateau-new/app/PowerSync/PowerSyncUploadRouter.php`](/home/mag/repo/billet-bateau-new/app/PowerSync/PowerSyncUploadRouter.php).
- Frontend local schema/runtime rely on replicated tables in [`/home/mag/repo/billet-bateau-new/resources/js/powersync/app.powersync-schema.js`](/home/mag/repo/billet-bateau-new/resources/js/powersync/app.powersync-schema.js) and [`/home/mag/repo/billet-bateau-new/resources/js/powersync/app-powersync.runtime.js`](/home/mag/repo/billet-bateau-new/resources/js/powersync/app-powersync.runtime.js).

## Migration steps

1. Replace Sync Rules config with Sync Streams config in the PowerSync Docker config directory, and update service wiring in [`/home/mag/repo/billet-bateau-new/docker/powersync/service.yaml`](/home/mag/repo/billet-bateau-new/docker/powersync/service.yaml) and Compose if required by the new service format.
2. Recreate data visibility semantics in Streams (mirror [`docker/powersync/sync-rules.yaml`](docker/powersync/sync-rules.yaml) after refactor):
   - user-scoped rows for `todos` and `programs`
   - **all rows from `addresses` for every user** (global address table on the client)
   - program-scoped **`media`** only (filter by `App\Models\Program` / `model_id` in program set for that user)
   - ensure Streams definitions include **`programs.address_id`** if the column exists in the replicated shape.
3. Validate auth compatibility end-to-end:
   - ensure Streams service accepts existing JWT shape (`sub`, `aud`, `kid`, HS256 secret) from [`/home/mag/repo/billet-bateau-new/app/Services/PowerSyncTokenIssuer.php`](/home/mag/repo/billet-bateau-new/app/Services/PowerSyncTokenIssuer.php)
   - adjust issuer/config only if Streams requirements differ.
4. Confirm upload contract compatibility:
   - if Streams keeps existing upload batch shape, retain current backend upload controllers/appliers
   - if Streams changes operation/table expectations, update upload validation/router/appliers and the frontend connector in [`/home/mag/repo/billet-bateau-new/resources/js/services/powersync.connector.js`](/home/mag/repo/billet-bateau-new/resources/js/services/powersync.connector.js).
5. Align frontend schema/runtime with migrated Streams definitions:
   - update table/column definitions if needed in [`/home/mag/repo/billet-bateau-new/resources/js/powersync/app.powersync-schema.js`](/home/mag/repo/billet-bateau-new/resources/js/powersync/app.powersync-schema.js)
   - bump or migrate local DB state handling in [`/home/mag/repo/billet-bateau-new/resources/js/powersync/app-powersync.runtime.js`](/home/mag/repo/billet-bateau-new/resources/js/powersync/app-powersync.runtime.js) if schema changes are breaking.
6. Expand focused tests to lock the migration:
   - update/extend [`/home/mag/repo/billet-bateau-new/tests/Feature/PowerSyncCredentialsControllerTest.php`](/home/mag/repo/billet-bateau-new/tests/Feature/PowerSyncCredentialsControllerTest.php) for JWT/credentials assumptions
   - update/extend [`/home/mag/repo/billet-bateau-new/tests/Feature/PowerSyncUploadControllerTest.php`](/home/mag/repo/billet-bateau-new/tests/Feature/PowerSyncUploadControllerTest.php) for validation, authorization isolation, and any changed upload types.

## Validation checklist

- PowerSync service starts with Streams config and reports healthy sync.
- Authenticated users receive user-scoped `todos`/`programs`, **full** `addresses` dataset, and only their programs’ `media` rows (not “all tables user-scoped”).
- Offline create/update/delete still uploads successfully for todos/programs/addresses.
- Outbox in [`/home/mag/repo/billet-bateau-new/resources/js/components/AppOutboxToolbarMenu.vue`](/home/mag/repo/billet-bateau-new/resources/js/components/AppOutboxToolbarMenu.vue) remains accurate after migration.
- Updated feature tests pass for credentials and upload flows.

## Related work

- Program ↔ address normalization (`programs.address_id`, global `addresses` replication, upload/router behavior) is specified in the **Program address_id refactor** Cursor plan; implement or reconcile that refactor **before or together with** this Streams migration so Streams config matches [`docker/powersync/sync-rules.yaml`](docker/powersync/sync-rules.yaml) and [`resources/js/powersync/app.powersync-schema.js`](resources/js/powersync/app.powersync-schema.js).

# Architecture Patterns: Template-Day Scheduling UX

**Domain:** Template day scheduling for staff admin  
**Researched:** 2026-04-30  
**Confidence:** HIGH

## Recommended Architecture

Use a **hybrid CQRS shape**:

- **PowerSync CRUD path** for low-risk row editing (`template_days`, `template_day_slots`, `template_day_dates`, `trips`).
- **Explicit command API path** for dangerous bulk apply operations (preview + commit), instead of letting the client fan out hundreds of trip mutations directly.

This keeps offline-first editing fast while making bulk scheduling safe, auditable, and deterministic.

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Laravel Template Catalog (CRUD) | Owns template day/slot/date validation and invariants per program | `POST /api/powersync/upload`, Eloquent models, PowerSync uplink router |
| Laravel Bulk Apply Service (Command API) | Computes preview (`create`, `skip`, `conflict`) and executes apply transactionally/idempotently | New HTTP endpoints, `Trip` model writes, optional queue job |
| Laravel Conflict Policy Layer | Defines duplicate semantics and write strategy (`skip` default, optional replace) | Bulk Apply Service, DB unique constraints / query guards |
| PowerSync Streams (`program_scope`) | Replicates templates/trips and apply artifacts to offline clients | PowerSync service + Vue client subscriptions |
| Vue Data Layer (TanStack DB collections) | Holds synced entities and optimistic local edits for template CRUD | PowerSync runtime (`syncStream`, outbox), page composables |
| Vue Scheduling Orchestrator Store | Manages apply wizard state (selected template, date range/dates, policy, preview token) | Bulk Apply endpoints + data layer |
| Quasar Scheduling UI | Template editor + calendar multi-select + confirmation dialog with conflict summary | Orchestrator store, collection queries |

## Backend Structure (Laravel API)

### 1) Keep entity CRUD on PowerSync upload

Current backend already supports:
- `template_days`
- `template_day_slots`
- `template_day_dates`
- `trips.template_day_slot_id`

Keep this for row-level edits because it matches local-first behavior and existing tests.

### 2) Add explicit bulk endpoints for safety

Add command endpoints (staff-authenticated, program-scoped):

- `POST /api/programs/{program}/template-applications/preview`
  - Input: `template_day_id`, `target_dates[]` (or range + weekday filter), conflict policy.
  - Output: deterministic preview list with counts:
    - `would_create`
    - `would_skip_duplicate`
    - `would_conflict`
    - `affected_trip_ids` (for replace mode only)
- `POST /api/programs/{program}/template-applications/commit`
  - Input: `preview_token` (or payload hash) + `idempotency_key`.
  - Behavior: applies exact previewed plan, returns operation summary.

Why: bulk apply is the risk point; it needs server-owned duplicate logic, idempotency, and auditability.

### 3) Duplicate/Conflict contract (server-owned)

Define duplicate key as:
`program_id + scheduled_departure_at + boat_type_id + water_route_id`

Default policy: **skip duplicates**, never silently overwrite existing trips.

Optional policy: `replace_existing` only after explicit confirmation.

### 4) Authorization and scoping

Use **program membership/capability** checks; do not use `user_id` as data visibility scope for fleet/program entities.  
This aligns with shared staff data rules.

## Sync Behavior (PowerSync)

## Current fit

Current architecture already subscribes `program_scope` by selected `program_id` and syncs:
- templates (`template_days`, `template_day_slots`, `template_day_dates`)
- dependent entities (`boat_types`, `water_routes`, `trips`)

This is the correct base for scheduling UX.

## Recommended adjustments

1. **Program-scoped sync authority**
   - Keep subscription parameter as `program_id`.
   - Move away from `programs.user_id` ownership assumptions in sync CTEs; rely on membership tables/capability mapping.

2. **Bulk apply visibility**
   - If commit is async, sync an `template_apply_operations` table (status + summary) so offline/online clients converge on operation outcomes.
   - If commit is sync, return summary immediately and rely on normal trip sync for result materialization.

3. **Outbox policy for apply**
   - Template CRUD remains optimistic.
   - Bulk apply commit should be **non-optimistic in UI semantics**: show "pending apply" state until server acknowledgment.
   - Surface blocked outbox state clearly because PowerSync upload queue is blocking FIFO.

## Frontend State and UI Structure (Vue + Quasar)

## State modules

Create/organize around three bounded stores/composables:

1. **Template Editor State**
   - CRUD for template days/slots
   - slot ordering and validation
2. **Calendar Selection State**
   - selected template day
   - selected dates (multi-select / range)
3. **Apply Wizard State**
   - conflict policy
   - preview result snapshot
   - commit lifecycle (`idle -> previewed -> committing -> committed|failed`)

Keep these separate so editing templates and applying templates do not cross-contaminate transient state.

## UI flow for safe bulk scheduling

1. Staff edits template day and slots (optimistic local-first).
2. Staff picks target dates in calendar.
3. Staff clicks "Preview apply".
4. UI shows confirmation dialog with:
   - trips to create
   - duplicates to skip
   - conflicts requiring explicit decision
5. Staff confirms commit.
6. UI shows operation result + pending/synced status.

Quasar recommendation: use custom dialog components via Dialog Plugin for reusable preview/confirm modals.

## Data Flow

### Flow A: Template CRUD (local-first)

1. User edits template entity in UI.
2. TanStack DB collection applies optimistic change.
3. PowerSync uploads mutation to `/api/powersync/upload`.
4. Laravel validates (`program` membership, route/template consistency).
5. On ack, upload queue advances and checkpoint sync confirms final state.

### Flow B: Bulk Apply (safe command path)

1. User selects template + dates and requests preview.
2. Laravel computes collision-aware apply plan from canonical DB state.
3. UI renders explicit summary in confirmation dialog.
4. User confirms; client calls commit endpoint with idempotency key.
5. Laravel writes `trips` (and optional operation record) transactionally.
6. PowerSync syncs resulting `trips` updates to all subscribed clients.
7. UI exits with audit-style summary (created/skipped/conflicted).

## Patterns to Follow

### Pattern 1: Server-owned dangerous operations
**What:** Keep bulk apply as explicit backend command, not client-side mass inserts.  
**When:** Any operation touching many calendar rows with conflict risk.

### Pattern 2: Program-bounded aggregates
**What:** All template day, slot, date, route, and trip relations must remain inside one program boundary.  
**When:** Every PUT/PATCH/DELETE and apply command.

### Pattern 3: Two-phase confirmation
**What:** Preview first, then commit exact preview token.  
**When:** Every bulk apply action.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client fan-out bulk writes through upload queue
**Why bad:** Hard to preview/conflict-resolve; failures can block FIFO queue; weak auditability.  
**Instead:** Command endpoint for preview+commit.

### Anti-Pattern 2: Silent duplicate overwrite
**Why bad:** Violates "safe bulk scheduling" and operator trust.  
**Instead:** Skip-by-default with explicit replace option.

### Anti-Pattern 3: `user_id` visibility scoping for shared fleet/program data
**Why bad:** Conflicts with shared staff operating model.  
**Instead:** Program membership/capability scoping.

## Suggested Build Order

1. **Conflict contract + duplicate key (backend)**
   - Finalize duplicate semantics and policies (`skip` default).
2. **Preview API endpoint**
   - Deterministic dry-run summary payload.
3. **Commit API endpoint with idempotency**
   - Transactional apply and operation summary.
4. **Sync alignment**
   - Ensure `program_scope` includes all required rows; optionally add operation-status table.
5. **Frontend state modules**
   - Separate editor, selection, and apply wizard stores.
6. **UI workflow**
   - Calendar multi-select + preview dialog + commit feedback.
7. **Hardening**
   - Feature tests for preview/commit conflict cases, offline/outbox UX states.

## Sources

- Project architecture/context files:
  - `/home/mag/repo/billet-bateau-new/.planning/PROJECT.md`
  - `/home/mag/repo/billet-bateau-new/README.md`
  - `/home/mag/repo/billet-bateau-new/docker/powersync/sync-config.yaml`
  - `/home/mag/repo/billet-bateau-new/resources/js/powersync/app-powersync.runtime.ts`
  - `/home/mag/repo/billet-bateau-new/app/PowerSync/PowerSyncUploadRouter.php`
- PowerSync docs (HIGH):
  - https://docs.powersync.com/architecture/consistency
  - https://docs.powersync.com/sync/streams/overview
- Laravel docs via Context7 (HIGH):
  - https://github.com/laravel/docs/blob/13.x/eloquent-resources.md
  - https://github.com/laravel/docs/blob/13.x/eloquent-relationships.md
- TanStack DB docs (HIGH):
  - https://tanstack.com/db/latest/docs/guides/mutations
- Quasar docs (MEDIUM for this design’s modal guidance):
  - https://quasar.dev/vue-components/dialog/

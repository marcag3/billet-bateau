# PowerSync Sync Optimization

> **Goal:** Move from eager all-table preload with decoupled stream subscriptions to on-demand, collection-driven sync scoped to one program at a time.

## Problem Summary

1. **Eager Sync Mode** — All 11 collections call `preload()` at boot, loading every row from every table into memory regardless of need.
2. **Decoupled Streams** — `user_scope` and `program_scope` streams are manually subscribed/unsubscribed via `setProgramSyncScopeId()`, completely disconnected from collection lifecycle. Streams keep syncing even when no live query uses the data.
3. **No DB Relations** — All relation-like lookups happen in Vue computed properties (e.g., `programs.value.find(p => p.id === x)`), bypassing TanStack DB's reactive join machinery.
4. **No `.where()` Filters** — Every live query fetches the entire collection (`from({ alias: col })` with no predicate), then filters in a Vue computed.

---

## Phase 1 — On-Demand Collections (remove `preload()`)

**Status:** ⬜ not started

> Remove all `preload()` calls. Each collection loads rows on-demand when a live query becomes active. Add `.where()` clauses to scope queries to the active program.

### 1.1 Remove preload loop

- [ ] Remove the `preload()` loop in `bootstrapAppPowerSync()` bootstrap path (~line 337)
- [ ] Remove the `preload()` loop in the already-bootstrapped early-return path (~line 440)

**File:** `resources/js/powersync/app-powersync.runtime.ts`

### 1.2 Add `.where()` to all live queries

Each page currently does `from({ alias: col })` then filters in a Vue computed. Replace with a `.where()` at the query level.

| Page | Collections | Current Pattern | Target |
|------|-------------|-----------------|--------|
| `AppBoatsPage.vue` | boats, programs, boat_types | fetch all → computed filter by `program_id` | `.where({ b }) => b.program_id, '=', pid)` |
| `AppBoatEditPage.vue` | boats, boat_types | fetch all → computed filter | `.where()` on program_id |
| `AppBoatCreatePage.vue` | boats, boat_types | fetch all → computed filter | `.where()` on program_id |
| `AppBoatTypesPage.vue` | boat_types, media | fetch all → computed filter | `.where()` on program_id |
| `AppTripsPage.vue` | trips, programs, boat_types, water_routes | fetch all → computed filter | `.where()` on program_id |
| `AppTripEditPage.vue` | trips, boat_types, water_routes | fetch all → computed filter | `.where()` on program_id |
| `AppTripCreatePage.vue` | trips, boat_types, water_routes | fetch all → computed filter | `.where()` on program_id |
| `AppTicketTypesPage.vue` | ticket_types, programs | fetch all → computed filter | `.where()` on program_id |
| `AppWaterRoutesPage.vue` | water_routes | fetch all → computed filter | `.where()` on program_id |
| `useProgramWorkspaceLayout.ts` | programs | `from({ p: col })` no filter | ✅ already fine (`user_scope` delivers only user's programs) |
| `AppProgramsPage.vue` | programs, media | fetch all → computed filter (media) | `.where()` on media program_id |
| `AppProgramEditPage.vue` | programs | fetch all → find by id | `.where()` on id |
| `AppProgramCreatePage.vue` | programs | no live query (insert only) | ✅ no change |

- [ ] `AppBoatsPage.vue`
- [ ] `AppBoatEditPage.vue`
- [ ] `AppBoatCreatePage.vue`
- [ ] `AppBoatTypesPage.vue`
- [ ] `AppTripsPage.vue`
- [ ] `AppTripEditPage.vue`
- [ ] `AppTripCreatePage.vue`
- [ ] `AppTicketTypesPage.vue`
- [ ] `AppWaterRoutesPage.vue`
- [ ] `AppProgramsPage.vue` (media collection)
- [ ] `AppProgramEditPage.vue`

---

## Phase 2 — Collection-Driven Stream Subscriptions

**Status:** ⬜ not started

> Remove manual stream subscriptions in favor of `onLoad`/`onLoadSubset` hooks. Only one `program_scope` subscription is active at a time — the latest opened program.

### 2.1 Wire `onLoad` hooks into collections

For each collection that needs `program_scope` data, add an `onLoad` hook that subscribes to the `program_scope` stream with the current `program_id`. When the last live query on that collection is disposed, `onLoadSubset` should unsubscribe.

- [ ] `boat_types` collection — `onLoad`: subscribe to `program_scope` with active `program_id`
- [ ] `boats` collection — same
- [ ] `trips` collection — same
- [ ] `ticket_types` collection — same
- [ ] `booking_tickets` collection — same
- [ ] `water_routes` collection — same
- [ ] `template_days` collection — same
- [ ] `template_day_slots` collection — same
- [ ] `template_day_dates` collection — same
- [ ] `media` collection — same
- [ ] `programs` collection — `user_scope` is `auto_subscribe: true`, verify no manual subscription needed

### 2.2 Remove manual stream management

- [ ] Remove `resyncUserScopeSubscription()` function
- [ ] Remove `resyncProgramScopeSubscription()` function
- [ ] Remove `userScopeSubscription` and `programScopeSubscription` variables
- [ ] Remove `programSyncScopeIdRef` and `getProgramSyncScopeIdRef()`
- [ ] Remove `setProgramSyncScopeId()` export
- [ ] Remove call to `setProgramSyncScopeId()` in router guard (`resources/js/router/index.ts`)
- [ ] Replace with a simple reactive `activeProgramId` ref that collections read from their `onLoad` hooks

**File:** `resources/js/powersync/app-powersync.runtime.ts` + `resources/js/router/index.ts`

### 2.3 Centralize active program tracking

- [ ] Create `activeProgramId` ref (replaces `programSyncScopeIdRef`)
- [ ] Export `getActiveProgramId()` and `setActiveProgramId()` 
- [ ] Router guard calls `setActiveProgramId(programId)` instead of `setProgramSyncScopeId(programId)`
- [ ] Each collection's `onLoad` hook reads `activeProgramId` to subscribe to the correct `program_scope` stream

---

## Phase 3 — TanStack DB Relations

**Status:** ⬜ not started

> Replace Vue-side lookups with TanStack DB reactive relations. This enables reactive joins and eliminates N+1 lookup patterns.

### 3.1 Define relations

Add `relations` to each collection definition using TanStack DB's relation system.

| Parent | Children | Foreign Key |
|--------|----------|-------------|
| `programs` | `boat_types` | `boat_types.program_id` |
| `programs` | `boats` | `boats.program_id` |
| `programs` | `trips` | `trips.program_id` |
| `programs` | `water_routes` | `water_routes.program_id` |
| `programs` | `ticket_types` | `ticket_types.program_id` |
| `programs` | `template_days` | `template_days.program_id` |
| `programs` | `template_day_dates` | `template_day_dates.program_id` |
| `programs` | `media` | `media.program_id` |
| `boat_types` | `boats` | `boats.boat_type_id` |
| `template_days` | `template_day_slots` | `template_day_slots.template_day_id` |
| `trips` → `boat_types` | many-to-one | `trips.boat_type_id` |
| `trips` → `water_routes` | many-to-one | `trips.water_route_id` |
| `trips` → `template_day_slots` | many-to-one | `trips.template_day_slot_id` |

- [ ] Define relations on `programs` collection
- [ ] Define relations on `boat_types` collection
- [ ] Define relations on `boats` collection
- [ ] Define relations on `trips` collection
- [ ] Define relations on `ticket_types` collection
- [ ] Define relations on `water_routes` collection
- [ ] Define relations on `template_days` collection
- [ ] Define relations on `template_day_slots` collection
- [ ] Define relations on `template_day_dates` collection
- [ ] Define relations on `media` collection

### 3.2 Replace Vue-side lookups with reactive joins

Each place that does `programs.value.find(p => p.id === x)` or `boatTypes.value.map(bt => ({label: bt.name, value: bt.id}))` should use TanStack DB joined queries instead.

- [ ] `AppBoatsPage.vue` — `selectedProgramName` computed (replaces `programs.value.find`)
- [ ] `AppBoatsPage.vue` — `boatTypeOptions` computed (replaces `boatTypes.value.map`)
- [ ] `AppTripsPage.vue` — `selectedProgramName` computed
- [ ] `AppTripsPage.vue` — `boatTypeOptions` computed
- [ ] `AppTripsPage.vue` — `waterRouteOptions` computed
- [ ] `AppBoatEditPage.vue` — `boatTypeOptions` computed
- [ ] `AppBoatCreatePage.vue` — `boatTypeOptions` computed
- [ ] `AppTripEditPage.vue` — `boatTypeOptions`, `waterRouteOptions`
- [ ] `AppTripCreatePage.vue` — `boatTypeOptions`, `waterRouteOptions`
- [ ] `AppTicketTypesPage.vue` — `programs` lookup for program name
- [ ] `useProgramWorkspaceLayout.ts` — `currentProgramLabel` (already uses `programs.value.find`, replace with joined query)
- [ ] `AppProgramEditPage.vue` — program lookup by id

---

## Phase 4 — Runtime Simplification

**Status:** ⬜ not started

> Clean up the runtime after phases 1–3 are complete.

### 4.1 Simplify `bootstrapAppPowerSync()`

- [ ] Boot path becomes: `new PowerSyncDatabase` → `db.init()` → `db.connect(connector)` → create collections (no preload, no manual streams)
- [ ] Already-bootstrapped early return path simply returns (no preload)

### 4.2 Clean up collection factory

- [ ] Replace the large `if/else if` chain with a map-based factory: `collectionFactories[name](db, onError)`

### 4.3 Remove dead code

- [ ] Remove `tableByName` map (if no longer needed)
- [ ] Remove `programSyncScopeIdRef`
- [ ] Remove `userScopeSubscription` / `programScopeSubscription`
- [ ] Remove `resyncUserScopeSubscription` / `resyncProgramScopeSubscription`
- [ ] Remove `setProgramSyncScopeId`
- [ ] Remove `getProgramSyncScopeIdRef`
- [ ] Remove `refreshOutboxSnapshot` from already-bootstrapped path (or keep only in status listener)

---

## Phase 5 — Verify

**Status:** ⬜ not started

- [ ] Run `php artisan test --compact` to verify backend tests still pass
- [ ] Manual smoke test: bootstrap → programs list loads
- [ ] Manual smoke test: navigate into a program → scoped data loads
- [ ] Manual smoke test: switch between programs → old stream unsubscribes, new stream subscribes
- [ ] Manual smoke test: navigate back to programs list → program_scope unsubscribes
- [ ] Verify offline behavior: cached data available without network
- [ ] Verify outbox still works after structural changes

---

## Migration Strategy

- Breaking changes preferred (no backward compat shims)
- This Vue app is the only API caller
- Edit existing migrations if needed (they are not deployed)
- Work through phases sequentially — each phase should leave the app in a working state

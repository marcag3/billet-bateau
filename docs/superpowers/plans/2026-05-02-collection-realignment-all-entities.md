# Collection Realignment — All Entities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 10 remaining PowerSync entity collections from Option 1 (bare type inference) to Option 4 (custom input/output types with deserialization schema) and remove all model composable wrappers.

**Architecture:** For each entity, create a typed PowerSync collection with Zod schemas. Extract helper utilities from old model files. Update all consumer pages to use collection + `useLiveQuery` directly. Delete old model files. Then remove shared infrastructure (entity.queries.ts, entity.relations.ts, model.definition.ts, model.registry.ts, entity.api.ts, readReplicatedBoolean).

**Tech Stack:** Laravel 13, PHP 8.5, Vue 3 (Composition API), Quasar, TanStack DB, Zod, PowerSync Web.

---

## File Structure

### Collection Files (Create — one per entity)

| File | Responsibility |
|------|----------------|
| `resources/js/powersync/boat-types.collection.ts` | Zod schema + deserialization + factory for boat_types |
| `resources/js/powersync/boats.collection.ts` | Zod schema + deserialization + factory for boats |
| `resources/js/powersync/trips.collection.ts` | Zod schema + deserialization + factory for trips |
| `resources/js/powersync/ticket-types.collection.ts` | Zod schema + deserialization + factory for ticket_types |
| `resources/js/powersync/water-routes.collection.ts` | Zod schema + deserialization + factory for water_routes |
| `resources/js/powersync/booking-tickets.collection.ts` | Zod schema + deserialization + factory for booking_tickets |
| `resources/js/powersync/template-days.collection.ts` | Zod schema + deserialization + factory for template_days |
| `resources/js/powersync/template-day-slots.collection.ts` | Zod schema + deserialization + factory for template_day_slots |
| `resources/js/powersync/template-day-dates.collection.ts` | Zod schema + deserialization + factory for template_day_dates |
| `resources/js/powersync/media.collection.ts` | Zod schema + deserialization + factory for media |

### Modified Files

| File | Change |
|------|--------|
| `resources/js/powersync/app-powersync.runtime.ts` | Add typed collections for all entities in the bootstrap loop; add `getXCollection()` exports; keep old `getXCollectionRef()` as aliases during migration |
| `resources/js/pages/AppBoatTypesPage.vue` | Use collection + useLiveQuery for boat_types; inline CRUD |
| `resources/js/pages/AppBoatsPage.vue` | Use collection + useLiveQuery for boats + boat_types; inline filtering |
| `resources/js/pages/AppBoatCreatePage.vue` | Use collection for boats + boat_types; inline insert |
| `resources/js/pages/AppBoatEditPage.vue` | Use collection for boats + boat_types; inline update/delete; preserve useBoatById/useBoatNeighborsInRoster |
| `resources/js/pages/AppTripsPage.vue` | Use collection for trips + boat_types + water_routes; inline filtering |
| `resources/js/pages/AppTripCreatePage.vue` | Use collection for trips + boat_types + water_routes; inline insert |
| `resources/js/pages/AppTripEditPage.vue` | Use collection for trips + boat_types + water_routes; inline update/delete; preserve useTripById/useTripNeighborsInProgram |
| `resources/js/pages/AppTicketTypesPage.vue` | Use collection for ticket_types; inline CRUD; `is_pay_what_you_can` becomes boolean |
| `resources/js/pages/AppWaterRoutesPage.vue` | Use collection for water_routes; inline CRUD |
| `resources/js/models/entity.queries.ts` | Remove (delete) after all migrations — no consumers left |
| `resources/js/models/entity.relations.ts` | Remove (delete) after all migrations — no consumers left |
| `resources/js/models/model.definition.ts` | Remove (delete) after all migrations — no consumers left |
| `resources/js/models/model.registry.ts` | Remove (delete) after all migrations — no consumers left |
| `resources/js/models/entity.api.ts` | Remove (delete) if no consumers remain |

### Deleted Files

| File | Model |
|------|-------|
| `resources/js/models/boats/boats.model.ts` | boats |
| `resources/js/models/boat-types/boat-types.model.ts` | boat_types |
| `resources/js/models/trips/trips.model.ts` | trips |
| `resources/js/models/ticket-types/ticket-types.model.ts` | ticket_types |
| `resources/js/models/water-routes/water-routes.model.ts` | water_routes |
| `resources/js/models/booking-tickets/booking-tickets.model.ts` | booking_tickets |
| `resources/js/models/template-days/template-days.model.ts` | template_days |
| `resources/js/models/template-day-slots/template-day-slots.model.ts` | template_day_slots |
| `resources/js/models/template-day-dates/template-day-dates.model.ts` | template_day_dates |
| `resources/js/models/media/media.model.ts` | media |
| `resources/js/utilities/replicated-boolean.ts` | No consumers after migration |

---

## Migration Pattern (per entity)

Each entity follows the same pattern established by programs:

### 1. Collection File

```typescript
import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appXxxPowerSyncTable } from './app.powersync-schema';

export const xxxSchema = z.object({
    // All columns: z.string().nullable() for text, z.boolean().nullable() for booleans, z.number() for integers
    id: z.string(),
    // ... other columns
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type XxxInput = z.input<typeof xxxSchema>;
export type XxxOutput = z.output<typeof xxxSchema>;

export const xxxDeserializationSchema = z.object({
    // Same shape but for booleans: z.number().nullable().transform(v => v != null ? v === 1 : null)
    // For all other types: identity
    id: z.string(),
    // ... other columns
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createXxxCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appXxxPowerSyncTable,
            schema: xxxSchema,
            deserializationSchema: xxxDeserializationSchema,
            onDeserializationError: (error) => { onError(error); },
        }),
    );
}
```

### 2. Runtime Update

In `app-powersync.runtime.ts`:
- Add `createXxxCollection` import
- Add typed collection creation in the bootstrap loop
- Add `getXxxCollection()` export (replacing `getXxxCollectionRef()`)

### 3. Page Migration

- Replace `useXxx()` with `getXxxCollection()` + `useLiveQuery`
- Replace `createXxxRow/patchXxxRow/deleteXxxRow` with inline collection operations
- Remove `ensureXxxReady` — bootstrap gated by AppBootstrapGate
- Add `refreshOutboxSnapshot()` calls after mutations
- Remove `Record<string, unknown>` casts
- Remove `readReplicatedBoolean`

---

## Entity Schemas

### boat_types

```typescript
// Table: user_id, program_id, name, created_at, updated_at
export const boatTypesSchema = z.object({
    id: z.string(),
    user_id: z.number().int().nullable(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
// Deserialization: Same shape (no boolean columns)
```

### boats

```typescript
// Table: user_id, boat_type_id, program_id, name, capacity, notes, created_at, updated_at
export const boatsSchema = z.object({
    id: z.string(),
    user_id: z.number().int().nullable(),
    boat_type_id: z.string().nullable(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    capacity: z.number().int().nullable(),
    notes: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
```

### trips

```typescript
// Table: program_id, boat_type_id, water_route_id, template_day_slot_id, scheduled_departure_at, capacity, created_at, updated_at
export const tripsSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    boat_type_id: z.string().nullable(),
    water_route_id: z.string().nullable(),
    template_day_slot_id: z.string().nullable(),
    scheduled_departure_at: z.string().nullable(),
    capacity: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
```

### ticket_types

```typescript
// Table: program_id, title, price_cents, is_pay_what_you_can (INTEGER→boolean), min_per_purchase, max_per_purchase, trip_inventory_caps, created_at, updated_at
export const ticketTypesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    title: z.string().nullable(),
    price_cents: z.number().int().nullable(),
    is_pay_what_you_can: z.boolean().nullable(),
    min_per_purchase: z.number().int().nullable(),
    max_per_purchase: z.number().int().nullable(),
    trip_inventory_caps: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
// Deserialization: is_pay_what_you_can: z.number().nullable().transform(v => v != null ? v === 1 : null)
```

### water_routes

```typescript
// Table: id, program_id, name, trace, duration_minutes, created_at, updated_at
export const waterRoutesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    trace: z.string().nullable(),
    duration_minutes: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
```

### booking_tickets

```typescript
// Table: booking_id, ticket_type_id, name, email, country, custom_fields, waiver_confirmation_id, created_at, updated_at
export const bookingTicketsSchema = z.object({
    id: z.string(),
    booking_id: z.string().nullable(),
    ticket_type_id: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    country: z.string().nullable(),
    custom_fields: z.string().nullable(),
    waiver_confirmation_id: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
```

### template_days

```typescript
// Table: id, program_id, name, created_at, updated_at
export const templateDaysSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
```

### template_day_slots

```typescript
// Table: id, template_day_id, sort_order, departure_time, capacity, boat_type_id, water_route_id, internal_notes, ticket_setup, created_at, updated_at
export const templateDaySlotsSchema = z.object({
    id: z.string(),
    template_day_id: z.string().nullable(),
    sort_order: z.number().int().nullable(),
    departure_time: z.string().nullable(),
    capacity: z.number().int().nullable(),
    boat_type_id: z.string().nullable(),
    water_route_id: z.string().nullable(),
    internal_notes: z.string().nullable(),
    ticket_setup: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
```

### template_day_dates

```typescript
// Table: id, program_id, template_day_id, service_date, created_at, updated_at
export const templateDayDatesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    template_day_id: z.string().nullable(),
    service_date: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
```

### media

```typescript
// Table: program_id, model_type, model_id, uuid, collection_name, name, file_name, mime_type, disk, conversions_disk, size, manipulations, custom_properties, generated_conversions, responsive_images, order_column, created_at, updated_at
export const mediaSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    model_type: z.string().nullable(),
    model_id: z.string().nullable(),
    uuid: z.string().nullable(),
    collection_name: z.string().nullable(),
    name: z.string().nullable(),
    file_name: z.string().nullable(),
    mime_type: z.string().nullable(),
    disk: z.string().nullable(),
    conversions_disk: z.string().nullable(),
    size: z.number().int().nullable(),
    manipulations: z.string().nullable(),
    custom_properties: z.string().nullable(),
    generated_conversions: z.string().nullable(),
    responsive_images: z.string().nullable(),
    order_column: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});
```

---

## Consumer Dependencies

| Page | Consumes |
|------|----------|
| AppBoatTypesPage.vue | boat_types (+ media via useEntityList) |
| AppBoatsPage.vue | boats, boat_types (+ programs — already migrated) |
| AppBoatCreatePage.vue | boats, boat_types |
| AppBoatEditPage.vue | boats, boat_types |
| AppTripsPage.vue | trips, boat_types, water_routes (+ programs — already migrated) |
| AppTripCreatePage.vue | trips, boat_types, water_routes |
| AppTripEditPage.vue | trips, boat_types, water_routes |
| AppTicketTypesPage.vue | ticket_types (+ programs — already migrated) |
| AppWaterRoutesPage.vue | water_routes |

Models with **no page consumers**: booking_tickets, template_days, template_day_slots, template_day_dates, media

---

## Execution Order (5 Sequential Batches)

### Batch 1 (Subagent A): boat_types + ticket_types
Independent — no overlapping page changes.
- Create: boat-types.collection.ts, ticket-types.collection.ts
- Update runtime for boat_types + ticket_types
- Update pages: AppBoatTypesPage, AppBoatsPage, AppBoatCreatePage, AppBoatEditPage, AppTripsPage, AppTripCreatePage, AppTripEditPage, AppTicketTypesPage
- Delete: boat-types.model.ts, ticket-types.model.ts

### Batch 2 (Subagent B): water_routes + boats
Independent of each other (boat pages vs water route pages).
- Create: boats.collection.ts, water-routes.collection.ts
- Update runtime for boats + water_routes
- Update pages: AppBoatsPage, AppBoatCreatePage, AppBoatEditPage, AppWaterRoutesPage, AppTripsPage, AppTripCreatePage, AppTripEditPage
- Delete: boats.model.ts, water-routes.model.ts

### Batch 3 (Subagent C): trips
- Create: trips.collection.ts
- Update runtime for trips
- Update pages: AppTripsPage, AppTripCreatePage, AppTripEditPage
- Delete: trips.model.ts

### Batch 4 (Subagent D): remaining models (no page consumers)
- Create: booking-tickets.collection.ts, template-days.collection.ts, template-day-slots.collection.ts, template-day-dates.collection.ts, media.collection.ts
- Update runtime for all 5
- Delete: booking-tickets.model.ts, template-days.model.ts, template-day-slots.model.ts, template-day-dates.model.ts, media.model.ts

### Batch 5 (Cleanup): Remove shared infrastructure
- Delete: entity.queries.ts, entity.relations.ts, model.definition.ts, model.registry.ts, entity.api.ts
- Delete: readReplicatedBoolean utility
- Keep validation files — they still provide form schemas

---

## Special: Helpers That Need Preservation

These helper functions from old model files need to be inlined or re-created as composables:

### useBoatById / useBoatNeighborsInRoster (from boats.model.ts)
These are computed refs that filter from the `boats` array. When boats is consumed directly via collection + useLiveQuery, these become:

```typescript
// In AppBoatEditPage.vue:
const boatsCollection = getBoatsCollection();
const { data: allBoats } = useLiveQuery(
    (qb) => { const col = boatsCollection.value; if (!col) return undefined; return qb.from({ b: col }); },
    [boatsCollection],
);
// Filtered to current program scope:
const programBoats = computed(() => {
    const pid = programId.value;
    if (pid.length === 0) return [];
    return (allBoats.value ?? []).filter((b) => String(b.program_id) === pid);
});
const currentBoat = computed(() => {
    const id = boatId.value;
    if (id.length === 0) return null;
    return programBoats.value.find((b) => String(b.id) === id) ?? null;
});
const neighbors = computed(() => {
    const id = boatId.value;
    const list = programBoats.value;
    const ids = list.map((b) => String(b.id));
    const idx = id.length === 0 ? -1 : ids.indexOf(id);
    // ... rest of neighbors logic
});
```

### useTripById / useTripNeighborsInProgram (from trips.model.ts)
Same pattern as boats.

### useBookingTicketsByBookingId (from booking-tickets.model.ts)
```typescript
// Inline in consumer:
const ticketsForBooking = computed(() => {
    const id = bookingId.value;
    if (id.length === 0) return [];
    return (allBookingTickets.value ?? []).filter((row) => String(row.booking_id) === id);
});
```

### templateDaySlots cross-references allTemplateDays (from template-day-slots.model.ts)
```typescript
const templateDaySlots = computed(() => {
    const pid = programSyncScopeIdRef.value.trim();
    if (pid.length === 0) return [];
    const dayIds = new Set(
        allTemplateDays.value
            .filter((row) => String(row.program_id) === pid)
            .map((row) => String(row.id)),
    );
    return allSlots.value.filter((row) => dayIds.has(String(row.template_day_id)));
});
```

### useEntityList for media (used in AppBoatTypesPage, AppProgramsPage)
`useEntityList` from entity.queries.ts wraps `useLiveQuery`. After migration, these become direct `useLiveQuery` calls with the media collection. This pattern already exists in the migrated AppProgramsPage.

---

## TicketType Mutations: is_pay_what_you_can becomes boolean

**Insert:**
```typescript
// Before:
is_pay_what_you_can: input.isPayWhatYouCan ? 1 : 0,

// After:
is_pay_what_you_can: input.isPayWhatYouCan,
```

**Update (via draft):**
```typescript
// Before:
draft.is_pay_what_you_can = values.isPayWhatYouCan ? 1 : 0;

// After:
draft.is_pay_what_you_can = values.isPayWhatYouCan;
```

**Read:**
```typescript
// Before:
Number(row.is_pay_what_you_can) === 1

// After:
row.is_pay_what_you_can === true
```

---

## Bootstrap & Error Handling

Same pattern as programs: each typed collection gets an `onDeserializationError` callback that sets an error state on the runtime. The `AppBootstrapGate` component surfaces it.

The runtime file accumulates `xxxDeserializationError` refs for each entity. These can be batched into a single `entityDeserializationErrors` map for simplicity.

---

## Out of Scope

- Validation files (`.validation.ts`) — kept as-is, they provide form schemas
- `entity.api.ts` — kept if still referenced, removed if not
- `utility/program-slug.ts` — kept
- All `entity.api.ts` consumers — not affected by this change

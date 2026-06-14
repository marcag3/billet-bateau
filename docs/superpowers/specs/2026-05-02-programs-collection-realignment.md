# Programs Collection Realignment

## Problem

All 11 PowerSync collections use Option 1 (bare type inference — no schema, no
deserializationSchema, no onDeserializationError). Query results return raw
SQLite types: `is_active` is `number` (0/1), `created_at` is a `string`, etc.

A manual `readReplicatedBoolean()` utility compensates at 4 call sites to
convert 0/1 → boolean. There is no runtime validation of incoming synced data.

Additionally, a Vue model wrapper (`usePrograms()`) sits between components and
the TanStack DB collection, creating a second abstraction boundary. Components
lose direct access to the collection's reactive queries, type transforms, and
live query features.

## Scope

This spec covers migrating only the **programs** entity to:
1. Option 4 schema (custom input/output types with deserialization)
2. Direct collection consumption by components (remove `usePrograms()`)

All other entities (`boats`, `trips`, `ticket_types`, etc.) keep their current
model wrappers. They can be migrated in subsequent passes.

## Schema & Collection

A new file `resources/js/powersync/programs.collection.ts` defines the Option 4
schema, deserialization schema, and exposes the typed collection.

### Input/Output Types

```typescript
const programSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  theme_color: z.string().nullable(),
  is_active: z.boolean().nullable(),
  is_archived: z.boolean().nullable(),
  slug: z.string().nullable(),
  line_1: z.string().nullable(),
  line_2: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
  created_at: z.string().nullable(),   // ISO string, not Date
  updated_at: z.string().nullable(),   // ISO string, not Date
});
```

Key decisions:
- `created_at` / `updated_at` stay as `string | null` (ISO strings) — no Date
  conversion needed, matches current usage everywhere.
- `is_active` / `is_archived` become `boolean | null` — eliminates
  `readReplicatedBoolean` at all call sites.
- Input and output types are identical (Option 4 pattern).

### Deserialization Schema

Transforms SQLite types → rich types on reads (or incoming sync):

```typescript
const programDeserializationSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  theme_color: z.string().nullable(),
  is_active: z.number().nullable().transform(v => v != null ? v === 1 : null),
  is_archived: z.number().nullable().transform(v => v != null ? v === 1 : null),
  slug: z.string().nullable(),
  line_1: z.string().nullable(),
  line_2: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
```

### No Custom Serializer Needed

A `serializer` option is not required. The PowerSync collection layer
automatically serializes `boolean` → SQLite `integer` (0/1) for
`column.integer` target columns, and `string` → SQLite `TEXT` for
`column.text` target columns.

### Error Handling

An `onDeserializationError` handler sets an error state on the runtime (same
pattern as the existing `errorMessage` ref), so `AppBootstrapGate` surfaces it.
This replaces the current silent data-inconsistency risk.

## Collection Lifecycle

The program collection is created inside `app-powersync.runtime.ts` during
bootstrap (same lifecycle as today). The existing `collectionRefs` map
continues to hold it.

The existing `getProgramsCollectionRef()` is replaced with a typed export:

```typescript
export function getProgramsCollection(): Ref<... | null> {
  return collectionRefs.programs;
}
```

## Consumer Changes (7 Files)

### AppProgramsPage.vue (list page)
- Replace `usePrograms()` with `getProgramsCollection()` + `useLiveQuery`
- Remove `readReplicatedBoolean` — `p.is_archived` is already `boolean | null`
- Remove `(p as Record<string, unknown>)` casts
- Remove `ensureProgramsReady` call (bootstrap gated by `AppBootstrapGate`)

### AppProgramEditPage.vue (edit page)
- Replace `usePrograms()` with collection + inline update logic
- `readReplicatedBoolean(p.is_active)` → `p.is_active` (already boolean)
- `readReplicatedBoolean(p.is_archived)` → `p.is_archived` (already boolean)
- Inline `updateProgramWithOptionalAddress` logic at the single call site
- Remove `(p as Record<string, unknown>)` casts
- `ensureProgramsReady` → check `getAppPowerSyncBootstrappedRef()`

### AppProgramCreatePage.vue (create page)
- Replace `createProgramWithOptionalAddress` with inline insert via collection
- Inline `normalizeThemeColor`, `buildInitialProgramSlug`,
  `normalizeAddressRowFields` (or import from utility file)
- Insert booleans directly instead of `? 1 : 0`

### useProgramWorkspaceLayout.ts (layout composable)
- Replace `usePrograms()` with collection + `useLiveQuery`
- Remove `readReplicatedBoolean` — filter on `p.is_archived === false` directly
- Remove `(p as Record<string, unknown>)` casts
- `ensureProgramsReady` → check bootstrap state

### AppTicketTypesPage.vue
- Replace `usePrograms()` with collection + `useLiveQuery` for program name
- Remove `(p as Record<string, unknown>)` casts

### AppTripsPage.vue
- Replace `usePrograms()` with collection + `useLiveQuery` for program name
- Remove `(p as Record<string, unknown>)` casts

### AppBoatsPage.vue
- Replace `usePrograms()` with collection + `useLiveQuery` for program name
- Remove `(p as Record<string, unknown>)` casts

## Removed File

`resources/js/models/programs/programs.model.ts` is deleted.

### Responsibility Redistribution

| Current | New Home |
|---|---|
| `usePrograms()` composable | Inlined into each consumer |
| `createProgramWithOptionalAddress` | Inlined into `AppProgramCreatePage.vue` |
| `updateProgramWithOptionalAddress` | Inlined into `AppProgramEditPage.vue` |
| `patchProgramRow` | Removed (unused — no consumers) |
| `normalizeThemeColor(hex)` | Moved to `resources/js/utilities/program-helpers.ts` |
| `buildInitialProgramSlug(name, id)` | Moved to `resources/js/utilities/program-helpers.ts` |
| `normalizeAddressRowFields(address)` | Moved to `resources/js/utilities/program-helpers.ts` |
| `programsModelDefinition` | Removed (unused elsewhere) |
| `addressHasAny(address)` | Moved to `resources/js/utilities/program-helpers.ts` |

### Mutation Pattern Change

Insert:
```typescript
// Before:
is_active: input.isActive ? 1 : 0,
is_archived: 0,

// After:
is_active: input.isActive,
is_archived: false,
```

Update:
```typescript
// Before:
draft.is_active = input.isActive ? 1 : 0;
draft.is_archived = input.isArchived ? 1 : 0;

// After:
draft.is_active = input.isActive;
draft.is_archived = input.isArchived;
```

## Bootstrap & Error Handling

`onDeserializationError` sets an error state on the runtime, surfaced via
`AppBootstrapGate`. The existing `errorMessage` ref pattern in
`app-powersync.runtime.ts` is reused.

## Out of Scope

- Other entities (`boats`, `trips`, `ticket_types`, `boat_types`, `water_routes`,
  `booking_tickets`, `media`, `template_days`, `template_day_slots`,
  `template_day_dates`) — kept as-is with their current model wrappers.
- The `useEntityList` utility — kept for other entities.
- The `readReplicatedBoolean` utility — kept for potential use by other
  entities until they are migrated.
- The `defineModel` / `entity.relations` / `model.definition` infrastructure
  — kept for other entities.

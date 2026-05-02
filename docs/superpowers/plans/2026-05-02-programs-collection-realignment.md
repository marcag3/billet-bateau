# Programs Collection Realignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the programs entity from Option 1 (bare type inference) to Option 4 (custom input/output types with deserialization schema) and remove the `usePrograms()` composable wrapper.

**Architecture:** Create a typed PowerSync collection with Zod schemas (input/output types + deserialization schema for SQLite-to-boolean transforms). Extract utility helpers from the old model into a shared file. All 7 consumer files switch from `usePrograms()` to direct collection consumption via `useLiveQuery`. The old model file is deleted.

**Tech Stack:** Laravel 13, PHP 8.5, Vue 3 (Composition API), Quasar, TanStack DB (`@tanstack/db` v0.6, `@tanstack/vue-db` v0.0.116, `@tanstack/powersync-db-collection` v0.1.43), Zod, PowerSync Web.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `resources/js/powersync/programs.collection.ts` | Create | Option 4 Zod schemas + typed collection factory |
| `resources/js/utilities/program-helpers.ts` | Create | `normalizeThemeColor`, `buildInitialProgramSlug`, `normalizeAddressRowFields`, `addressHasAny` |
| `resources/js/powersync/app-powersync.runtime.ts` | Modify | Use typed collection for programs; add `getProgramsCollection()`; add error state |
| `resources/js/pages/AppProgramsPage.vue` | Modify | Use collection + `useLiveQuery` instead of `usePrograms()` |
| `resources/js/pages/AppProgramEditPage.vue` | Modify | Use collection + inline update instead of `usePrograms()` |
| `resources/js/pages/AppProgramCreatePage.vue` | Modify | Inline insert logic + import helpers |
| `resources/js/composables/useProgramWorkspaceLayout.ts` | Modify | Use collection + `useLiveQuery` instead of `usePrograms()` |
| `resources/js/pages/AppTicketTypesPage.vue` | Modify | Use collection + `useLiveQuery` instead of `usePrograms()` |
| `resources/js/pages/AppTripsPage.vue` | Modify | Use collection + `useLiveQuery` instead of `usePrograms()` |
| `resources/js/pages/AppBoatsPage.vue` | Modify | Use collection + `useLiveQuery` instead of `usePrograms()` |
| `resources/js/models/programs/programs.model.ts` | Delete | Old model file removed |

---

### Task 1: Create `resources/js/powersync/programs.collection.ts`

**Files:**
- Create: `resources/js/powersync/programs.collection.ts`
- Reference: `resources/js/powersync/app-powersync.runtime.ts` (for collection creation pattern)
- Reference: `resources/js/powersync/app.powersync-schema.ts` (for `appProgramsPowerSyncTable`)

- [ ] **Step 1: Create the typed collection file**

Create the file with:
- `programSchema` — Zod object for input/output types (all fields match the spec, `is_active`/`is_archived` are `z.boolean().nullable()`)
- `programDeserializationSchema` — Zod object that transforms SQLite types: `is_active: z.number().nullable().transform(v => v != null ? v === 1 : null)`, same for `is_archived`
- `createProgramsCollection()` — factory that calls `createCollection(powerSyncCollectionOptions(...))` with `schema`, `deserializationSchema`, and `onDeserializationError`
- `ProgramInput` / `ProgramOutput` type exports (inferred from Zod schemas)

```typescript
import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appProgramsPowerSyncTable } from './app.powersync-schema';

export const programSchema = z.object({
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
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _programInputCheck: z.infer<typeof programSchema> = null!;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _programOutputCheck: z.infer<typeof programSchema> = null!;

export type ProgramInput = z.input<typeof programSchema>;
export type ProgramOutput = z.output<typeof programSchema>;

export const programDeserializationSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    theme_color: z.string().nullable(),
    is_active: z.number().nullable().transform((v) => v != null ? v === 1 : null),
    is_archived: z.number().nullable().transform((v) => v != null ? v === 1 : null),
    slug: z.string().nullable(),
    line_1: z.string().nullable(),
    line_2: z.string().nullable(),
    city: z.string().nullable(),
    postal_code: z.string().nullable(),
    country: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createProgramsCollection(database: import('@powersync/web').PowerSyncDatabase, onError: (error: unknown) => void) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appProgramsPowerSyncTable,
            schema: programSchema,
            deserializationSchema: programDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/powersync/programs.collection.ts
git commit -m "feat: create typed programs PowerSync collection with Option 4 schema"
```

---

### Task 2: Create `resources/js/utilities/program-helpers.ts`

**Files:**
- Create: `resources/js/utilities/program-helpers.ts`
- Source: Extract from `resources/js/models/programs/programs.model.ts`

- [ ] **Step 1: Create the utility file**

Extract `addressHasAny`, `normalizeThemeColor`, `buildInitialProgramSlug`, `normalizeAddressRowFields` from the old model file into this new utility file, preserving their exact implementations. Import `foldUnicodeForProgramSlug` from `../utilities/program-slug`.

```typescript
import { foldUnicodeForProgramSlug } from './program-slug';

export function addressHasAny(address: Record<string, string | undefined | null>): boolean {
    return ['line_1', 'line_2', 'city', 'postal_code', 'country'].some((key) => {
        const value = address[key];
        return typeof value === 'string' && value.trim().length > 0;
    });
}

export function normalizeThemeColor(hex: unknown): string {
    const trimmed = String(hex ?? '').trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
        return trimmed.slice(0, 1) + trimmed.slice(1).toUpperCase();
    }
    return '#000000';
}

export function buildInitialProgramSlug(name: string, id: string): string {
    const t = foldUnicodeForProgramSlug(name).toLowerCase();
    const kebab = t
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    if (kebab.length > 0) {
        return kebab.length > 200 ? kebab.slice(0, 200) : kebab;
    }
    const h = id.replace(/-/g, '');
    return `p-${h.slice(0, 8)}`.toLowerCase();
}

export function normalizeAddressRowFields(address: Record<string, string | undefined | null>): Record<string, string | null> {
    if (!addressHasAny(address)) {
        return {
            line_1: null,
            line_2: null,
            city: null,
            postal_code: null,
            country: null,
        };
    }
    return {
        line_1: typeof address.line_1 === 'string' ? address.line_1.trim() || null : null,
        line_2: typeof address.line_2 === 'string' ? address.line_2.trim() || null : null,
        city: typeof address.city === 'string' ? address.city.trim() || null : null,
        postal_code: typeof address.postal_code === 'string' ? address.postal_code.trim() || null : null,
        country: typeof address.country === 'string' ? address.country.trim() || null : null,
    };
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/utilities/program-helpers.ts
git commit -m "feat: extract program helpers from model into shared utility file"
```

---

### Task 3: Update `resources/js/powersync/app-powersync.runtime.ts`

**Files:**
- Modify: `resources/js/powersync/app-powersync.runtime.ts`

- [ ] **Step 1: Add import for `createProgramsCollection`**

Add at the top:
```typescript
import { createProgramsCollection } from './programs.collection';
```

- [ ] **Step 2: Add an error ref for programs deserialization errors**

After the existing `errorMessage` ref, add:
```typescript
const programsDeserializationError = ref<unknown>(null);
```

- [ ] **Step 3: Update the programs collection creation in `bootstrapAppPowerSync`**

Find the `for (const name of Object.keys(tableByName))` loop. The programs collection needs special handling. Change the loop body so that when `name === 'programs'`, it uses `createProgramsCollection(db, (error) => { programsDeserializationError.value = error; errorMessage.value = error instanceof Error ? error.message : loadFailedMessage; })` instead of the generic `createCollection`.

The cleanest approach: change the loop body to conditionally create the typed collection for programs:

```typescript
for (const name of Object.keys(tableByName)) {
    const table = tableByName[name];
    let collection;
    if (name === 'programs') {
        collection = createProgramsCollection(db, (error) => {
            programsDeserializationError.value = error;
            errorMessage.value = error instanceof Error ? error.message : loadFailedMessage;
        });
    } else {
        const collectionOptions = powerSyncCollectionOptions({
            database: db,
            table,
        });
        collection = createCollection(/** @type {any} */(collectionOptions));
    }
    collectionRefs[name].value = collection;
}
```

- [ ] **Step 4: Replace `getProgramsCollectionRef` with `getProgramsCollection`**

Replace:
```typescript
export function getProgramsCollectionRef() {
    return collectionRefs.programs;
}
```
With:
```typescript
export function getProgramsCollection() {
    return collectionRefs.programs;
}
```

- [ ] **Step 5: Add programsDeserializationError accessor (optional, for error surfacing)**

Add:
```typescript
export function getProgramsDeserializationErrorRef() {
    return programsDeserializationError;
}
```

- [ ] **Step 6: Commit**

```bash
git add resources/js/powersync/app-powersync.runtime.ts
git commit -m "feat: use typed programs collection in PowerSync runtime"
```

---

### Task 4: Update `resources/js/pages/AppProgramsPage.vue`

**Files:**
- Modify: `resources/js/pages/AppProgramsPage.vue`

- [ ] **Step 1: Rewrite the script section**

Replace the script setup to:
- Remove `import { usePrograms } from "../models/programs/programs.model"`
- Remove `import { useEntityList } from "../models/entity.queries"`
- Remove `import { readReplicatedBoolean } from "../utilities/replicated-boolean"`
- Remove `ensureProgramsReady` usage
- Add `import { getProgramsCollection } from "../powersync/app-powersync.runtime"`
- Add `import { useLiveQuery } from '@tanstack/vue-db'`

Replace the `usePrograms()` and derived computed properties:

```typescript
import { useLiveQuery } from '@tanstack/vue-db';
// ... other imports
import { getProgramsCollection } from "../powersync/app-powersync.runtime";

const programsCollection = getProgramsCollection();

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder
            .from({ p: col })
            .orderBy(({ p }) => p.updated_at, 'desc')
            .orderBy(({ p }) => p.created_at, 'desc')
            .orderBy(({ p }) => p.id, 'desc');
    },
    [programsCollection],
);
```

- Remove `onMounted` callback with `ensureProgramsReady` — bootstrap gated by `AppBootstrapGate`
- Update `filteredPrograms` to use `p.is_archived` directly (already boolean):
  - Remove `readReplicatedBoolean` and `(p as Record<string, unknown>)` casts
  - Replace with `!p.is_archived` and `p.is_archived`
- Update `programDescription`, `addressDisplayLines`, `placeholderStyle`, `copyPublicUrl` to accept `ProgramOutput` type instead of `Record<string, unknown>`
- Remove the `PROGRAM_MODEL` constant if no longer needed (it's used by `primaryImageFor` which looks at media rows — keep that function but update its type)

Key: The `programs` ref is now `Ref<ProgramOutput[] | undefined>`, so `programs.value ?? []` yields `ProgramOutput[]`. All properties are typed.

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/AppProgramsPage.vue
git commit -m "refactor: AppProgramsPage uses typed collection directly"
```

---

### Task 5: Update `resources/js/pages/AppProgramEditPage.vue`

**Files:**
- Modify: `resources/js/pages/AppProgramEditPage.vue`

- [ ] **Step 1: Rewrite to use collection + inline update**

Changes:
- Remove `import { usePrograms } from "../models/programs/programs.model"`
- Remove `import { readReplicatedBoolean } from "../utilities/replicated-boolean"`
- Add `import { getProgramsCollection } from "../powersync/app-powersync.runtime"`
- Add `import { useLiveQuery } from '@tanstack/vue-db'`
- Add `import { normalizeThemeColor, normalizeAddressRowFields } from "../utilities/program-helpers"`
- Add `import { ulid } from 'ulid'` (for slug generation in create scenario — actually edit doesn't need ulid)
- Add `import { refreshOutboxSnapshot } from "../powersync/app-powersync.runtime"` (already imports from there via `getAppPowerSyncBootstrappedRef`)
- Add `import { getCurrentUserIdRef } from "../powersync/app-powersync.runtime"` if needed — actually edit doesn't need userId

Replace `usePrograms()`:
```typescript
import { getProgramsCollection, refreshOutboxSnapshot, getAppPowerSyncBootstrappedRef } from "../powersync/app-powersync.runtime";
import { useLiveQuery } from '@tanstack/vue-db';

const programsCollection = getProgramsCollection();

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ p: col });
    },
    [programsCollection],
);
```

Update the hydration watch:
- Remove `readReplicatedBoolean(p.is_active)` → use `p.is_active` directly (already boolean)
- Remove `readReplicatedBoolean(p.is_archived)` → use `p.is_archived` directly (already boolean)
- Remove `(p as Record<string, unknown>)` cast — just check `hasBootstrapped.value` before accessing

Replace `updateProgramWithOptionalAddress` call in `onFormSubmit` with inline collection update:

```typescript
const col = programsCollection.value;
if (!col) {
    throw new Error('Programs collection is not ready.');
}
const themeColor = normalizeThemeColor(values.themeColor);
const now = new Date().toISOString();
const addressFields = normalizeAddressRowFields({ ...values.address });

col.update(id, (draft) => {
    draft.name = values.name.trim();
    draft.description = values.description.trim().length > 0 ? values.description.trim() : null;
    draft.theme_color = themeColor;
    draft.slug = values.slug;
    draft.is_active = values.isActive;
    draft.is_archived = values.isArchived;
    draft.line_1 = addressFields.line_1;
    draft.line_2 = addressFields.line_2;
    draft.city = addressFields.city;
    draft.postal_code = addressFields.postal_code;
    draft.country = addressFields.country;
    draft.updated_at = now;
});

void refreshOutboxSnapshot();
```

Remove `ensureProgramsReady` — bootstrap check via `getAppPowerSyncBootstrappedRef()` already done by `showNotFound`.

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/AppProgramEditPage.vue
git commit -m "refactor: AppProgramEditPage uses typed collection directly"
```

---

### Task 6: Update `resources/js/pages/AppProgramCreatePage.vue`

**Files:**
- Modify: `resources/js/pages/AppProgramCreatePage.vue`

- [ ] **Step 1: Inline insert logic**

Changes:
- Remove `import { usePrograms } from "../models/programs/programs.model"`
- Add `import { getProgramsCollection, getCurrentUserIdRef, refreshOutboxSnapshot, bootstrapAppPowerSync, getAppPowerSyncBootstrappedRef } from "../powersync/app-powersync.runtime"`
- Add `import { useLiveQuery } from '@tanstack/vue-db'` (for collection access)
- Add `import { normalizeThemeColor, buildInitialProgramSlug, normalizeAddressRowFields } from "../utilities/program-helpers"`
- Add `import { ulid } from 'ulid'`

Replace `createProgramWithOptionalAddress` call in `onFormSubmit` with inline insert:

```typescript
async function ensureBootstrapped() {
    if (!getAppPowerSyncBootstrappedRef().value) {
        await bootstrapAppPowerSync();
    }
}

const onFormSubmit = handleSubmit(async (values: ProgramCreateFormValues) => {
    errorMessage.value = "";
    try {
        await ensureBootstrapped();
        const col = getProgramsCollection().value;
        if (!col) {
            throw new Error('Programs collection is not ready.');
        }
        const parsedUserId = Number.parseInt(getCurrentUserIdRef().value, 10);
        const id = ulid();
        const now = new Date().toISOString();
        const themeColor = normalizeThemeColor(values.themeColor);
        const addressFields = normalizeAddressRowFields({ ...values.address });

        await col
            .insert({
                id,
                name: values.name.trim(),
                description: values.description.trim().length > 0 ? values.description.trim() : null,
                theme_color: themeColor,
                is_active: values.isActive,
                is_archived: false,
                slug: buildInitialProgramSlug(values.name, id),
                line_1: addressFields.line_1,
                line_2: addressFields.line_2,
                city: addressFields.city,
                postal_code: addressFields.postal_code,
                country: addressFields.country,
                created_at: now,
                updated_at: now,
            })
            .isPersisted.promise;

        void refreshOutboxSnapshot();

        // ... rest of the handler (file upload, notify, redirect)
    }
});
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/AppProgramCreatePage.vue
git commit -m "refactor: AppProgramCreatePage uses typed collection directly"
```

---

### Task 7: Update `resources/js/composables/useProgramWorkspaceLayout.ts`

**Files:**
- Modify: `resources/js/composables/useProgramWorkspaceLayout.ts`

- [ ] **Step 1: Use collection + useLiveQuery**

Changes:
- Remove `import { usePrograms } from '../models/programs/programs.model'`
- Remove `import { readReplicatedBoolean } from '../utilities/replicated-boolean'`
- Add `import { useLiveQuery } from '@tanstack/vue-db'`
- Add `import { getProgramsCollection, getAppPowerSyncBootstrappedRef } from '../powersync/app-powersync.runtime'`

Replace `const { programs, ensureProgramsReady } = usePrograms()` with:

```typescript
const programsCollection = getProgramsCollection();

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ p: col });
    },
    [programsCollection],
);
```

Update `visibleProgramIds` — remove `readReplicatedBoolean` and `(p as Record<string, unknown>)` cast, use `p.is_archived` directly.

Update `programSwitcherOptions` — remove `(p as Record<string, unknown>)` cast, use `p.name` directly.

Update `currentProgramLabel` — remove `(row as Record<string, unknown>)` cast, use `row.name` directly.

Remove `ensureProgramsReady` from `onMounted` — bootstrap is gated by `AppBootstrapGate`.

- [ ] **Step 2: Commit**

```bash
git add resources/js/composables/useProgramWorkspaceLayout.ts
git commit -m "refactor: useProgramWorkspaceLayout uses typed collection directly"
```

---

### Task 8: Update `resources/js/pages/AppTicketTypesPage.vue`

**Files:**
- Modify: `resources/js/pages/AppTicketTypesPage.vue`

- [ ] **Step 1: Use collection + useLiveQuery**

Changes:
- Remove `import { usePrograms } from '../models/programs/programs.model'`
- Add `import { useLiveQuery } from '@tanstack/vue-db'`
- Add `import { getProgramsCollection } from '../powersync/app-powersync.runtime'`

Replace `const { programs, ensureProgramsReady } = usePrograms()` with:

```typescript
const programsCollection = getProgramsCollection();

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ p: col });
    },
    [programsCollection],
);
```

Update `selectedProgramName` — remove `(row as Record<string, unknown>)` cast, use `row.name` directly.

Remove `ensureProgramsReady()` from `onMounted`.

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/AppTicketTypesPage.vue
git commit -m "refactor: AppTicketTypesPage uses typed collection directly"
```

---

### Task 9: Update `resources/js/pages/AppTripsPage.vue`

**Files:**
- Modify: `resources/js/pages/AppTripsPage.vue`

- [ ] **Step 1: Use collection + useLiveQuery**

Same pattern as Task 8:
- Remove `import { usePrograms } from '../models/programs/programs.model'`
- Add `import { useLiveQuery } from '@tanstack/vue-db'`
- Add `import { getProgramsCollection } from '../powersync/app-powersync.runtime'`
- Replace `const { programs, ensureProgramsReady } = usePrograms()` with collection + `useLiveQuery`
- Update `selectedProgramName` — remove `(row as Record<string, unknown>)` cast
- Remove `ensureProgramsReady()` from `onMounted`

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/AppTripsPage.vue
git commit -m "refactor: AppTripsPage uses typed collection directly"
```

---

### Task 10: Update `resources/js/pages/AppBoatsPage.vue`

**Files:**
- Modify: `resources/js/pages/AppBoatsPage.vue`

- [ ] **Step 1: Use collection + useLiveQuery**

Same pattern as Task 8:
- Remove `import { usePrograms } from '../models/programs/programs.model'`
- Add `import { useLiveQuery } from '@tanstack/vue-db'`
- Add `import { getProgramsCollection } from '../powersync/app-powersync.runtime'`
- Replace `const { programs, ensureProgramsReady } = usePrograms()` with collection + `useLiveQuery`
- Update `selectedProgramName` — remove `(row as Record<string, unknown>)` cast
- Remove `ensureProgramsReady()` from `onMounted`

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/AppBoatsPage.vue
git commit -m "refactor: AppBoatsPage uses typed collection directly"
```

---

### Task 11: Delete `resources/js/models/programs/programs.model.ts`

**Files:**
- Delete: `resources/js/models/programs/programs.model.ts`

- [ ] **Step 1: Verify no remaining imports**

Quick check to ensure no other files still import `usePrograms` or anything from the old model:

Run `rg "usePrograms|programs.model|programsModelDefinition|patchProgramRow|createProgramWithOptionalAddress|updateProgramWithOptionalAddress" resources/js --type ts --type vue`

If no results: safe to delete.

- [ ] **Step 2: Delete the file**

```bash
git rm resources/js/models/programs/programs.model.ts
git commit -m "feat: remove programs.model.ts — replaced by typed collection"
```

---

### Task 12: Run tests and verify

- [ ] **Step 1: Run PHP tests**

```bash
php artisan test --compact --filter=Program
```

- [ ] **Step 2: Run frontend build check**

```bash
npm run build 2>&1 | head -50
```

Expect: No TypeScript/compilation errors.

- [ ] **Step 3: If tests pass, confirm completion**

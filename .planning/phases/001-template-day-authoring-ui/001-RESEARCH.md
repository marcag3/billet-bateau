# Phase 1: Template Day Authoring UI - Research

**Researched:** 2026-04-30  
**Domain:** Quasar/Vue admin CRUD UX over PowerSync + TanStack DB; template-day scheduling time model  
**Confidence:** MEDIUM-HIGH

## User Constraints (from CONTEXT.md)

No Phase 1 `*-CONTEXT.md` file found in `.planning/phases/001-template-day-authoring-ui/`. [VERIFIED: repo glob]

## Summary

Phase 1 is best planned as **offline-first CRUD over three existing PowerSync-backed entities**—`template_days`, `template_day_slots`, and (optionally for UI) `template_day_dates`—implemented as standard Quasar admin pages under the existing program-scoped edit context routes. The backend and sync foundations for these entities already exist (Laravel models + migrations + PowerSync upload router + feature tests), and the frontend already has TanStack DB collection models for `template_days`, `template_day_slots`, and `template_day_dates`, including helpers that insert/update/delete rows and drain the upload queue.

The biggest “plan it right or rework later” issue is the **time model contract**. `template_day_slots.departure_time` is currently stored as a strict `HH:MM:SS` string, while `template_day_dates.service_date` is a `YYYY-MM-DD` string, and real scheduled trips use `trips.scheduled_departure_at` (`dateTimeTz`). Phase 1 UI must treat slot departure time as **a local time-of-day**, not an absolute timestamp, and it must store it in the backend-required format (`HH:mm:ss`). DST and timezone conversion become critical in later phases (apply/preview), but Phase 1 should still encode the correct intent and validate formatting early to avoid data cleanup.

**Primary recommendation:** Implement Template Days + Slots authoring as PowerSync CRUD pages (Quasar + vee-validate/zod) under `/programs/:programId/edit-context`, using `QTime` with `with-seconds` to store `departure_time` as `HH:mm:ss`, and explicitly define a stable “ticket setup” + “internal notes” slot payload in storage/sync so TMPL-04/TMPL-05 are real, not placeholder UI.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Template day + slots CRUD (create/edit/delete) | Browser / Client | API / Backend | Offline-first authoring should be local (PowerSync outbox), with server validation + authorization on upload. [VERIFIED: repo PowerSync upload controller + frontend models] |
| Program scoping in admin | Browser / Client | API / Backend | Route guard sets active program sync scope (`program_scope`), which filters collections by program id in Vue models. [VERIFIED: `resources/js/router/index.ts`, `resources/js/models/template-days/template-days.model.ts`] |
| Slot time input + formatting (`departure_time`) | Browser / Client | API / Backend | UI owns input affordances; backend owns schema/validation (`HH:MM:SS` regex). [VERIFIED: `TemplateDaySlotPutData` rules + Quasar QTime docs] |
| Ticket setup constraints + internal notes per slot | Database / Storage | Browser / Client | Needs persisted fields for offline edits; UI should edit without extra API. [VERIFIED: Phase 1 requirements TMPL-04/TMPL-05 + existing migration lacks fields] |
| Dangerous bulk apply (preview/commit) | API / Backend | — | Explicitly out of Phase 1 scope; later phases should use command endpoints rather than client fan-out. [VERIFIED: `.planning/research/ARCHITECTURE.md`] |

## Project Constraints (from `.cursor/rules/`)

- **Prefer clean breaking changes** over backwards compatibility; do not add shims/dual paths unless explicitly requested. [VERIFIED: `.cursor/rules/breaking-changes-preferred.mdc`]
- **Vue app is the only API caller** (so API breaking changes are acceptable). [VERIFIED: `.cursor/rules/breaking-changes-preferred.mdc`]
- **Edit existing migrations**; they are not deployed. [VERIFIED: `.cursor/rules/breaking-changes-preferred.mdc`]
- **Do not use `user_id` scoping** for fleet/program/shared staff data; `user_id` is optional audit metadata only. [VERIFIED: `.cursor/rules/no-user-id-scoping-fleet-entities.mdc`]
- **Avoid `loadMissing()`**; eager load at query call sites (or orchestrator boundaries) instead. [VERIFIED: `.cursor/rules/dto-eloquent-relations.mdc`]

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TMPL-01 | Staff can create a template day for a selected program | Existing PowerSync CRUD upload supports `template_days` PUT; Vue `useTemplateDays()` supports `createTemplateDayRow()` filtered by selected program scope. [VERIFIED: `tests/Feature/PowerSyncUploadTemplateDayTest.php`, `resources/js/models/template-days/template-days.model.ts`] |
| TMPL-02 | Staff can add and edit template slots with departure time | Existing `template_day_slots` table has `departure_time` (`HH:MM:SS`) and ordering; Vue `useTemplateDaySlots()` exists. UI should use `QTime` `with-seconds` to match format. [VERIFIED: migration + DTO rules + Quasar QTime docs] |
| TMPL-03 | Staff can set boat type, water route, and capacity per template slot | `template_day_slots` already has `boat_type_id`, `water_route_id`, `capacity`; these tables are in `program_scope` and have existing admin pages/patterns to reuse. [VERIFIED: migration + existing pages + PowerSync schema module list] |
| TMPL-04 | Staff can configure ticket setup and constraints per template slot | **Storage gap:** current schema/DTOs do not include any ticket setup field on `template_day_slots`. Plan must add a persisted/synced payload (likely JSON) now so UI can edit offline. [VERIFIED: migration + `TemplateDaySlotPutData`/`PatchData` lack fields] |
| TMPL-05 | Staff can add internal notes per template slot | **Storage gap:** current schema/DTOs do not include a notes field on `template_day_slots`. Plan must add and validate it. [VERIFIED: migration + `TemplateDaySlotPutData`/`PatchData` lack fields] |

## Standard Stack

### Core (already in repo)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue | `3.5.32` | Admin UI pages/components | Already the app’s SPA stack. [VERIFIED: `package.json`] |
| Quasar | `2.19.3` | UI components/layout/forms | Consistent admin UX + PWA-friendly components. [VERIFIED: `package.json`] |
| Pinia | `3.0.4` | UI/session state | Existing auth + layout stores already use it. [VERIFIED: `package.json`, `.planning/codebase/ARCHITECTURE.md`] |
| vee-validate + zod | `4.15.1` + `4.3.6` | Form validation | Existing pages use `useForm()` + `createQuasarFieldBinder()`. [VERIFIED: `package.json`, `AppWaterRoutesPage.vue`, `AppTicketTypesPage.vue`] |
| @powersync/web | `1.37.2` | Offline sync + upload queue | Existing runtime (`app-powersync.runtime.ts`) manages bootstrapping, streams, outbox. [VERIFIED: `package.json`, `resources/js/powersync/app-powersync.runtime.ts`] |
| @tanstack/db + @tanstack/vue-db | `0.6.5` + `0.0.116` | Local collections + reactive queries | Existing model definition pattern uses TanStack DB collections. [VERIFIED: `package.json`, `resources/js/models/**`] |
| Laravel | v13 | Validated persistence + authorization on upload | Existing PowerSync upload controller runs CRUD batch in a transaction and requires auth. [VERIFIED: `app/Http/Controllers/Api/PowerSyncUploadController.php`] |
| PHPUnit | v12 | Backend feature tests | Existing feature tests cover PowerSync upload for templates. [VERIFIED: `tests/Feature/PowerSyncUploadTemplateDayTest.php`] |
| Vitest + Testing Library Vue | `4.1.5` + `8.1.0` | Frontend tests | Repo has `resources/js/tests/**` and `npm test` runs vitest. [VERIFIED: `package.json`, grep results] |

### Supporting (use, don’t replace)

| Library / Module | Purpose | When to Use |
|------------------|---------|-------------|
| `resources/js/powersync/app-powersync.runtime.ts` | Bootstrap DB, manage stream subscriptions, expose outbox state | Always use for ensuring collections ready + reflecting offline/outbox issues in UI. [VERIFIED: repo file] |
| `resources/js/validation/quasar-vee-fields` | Quasar ↔ vee-validate binding | Use for create/edit dialogs and slot forms for consistent UX. [VERIFIED: `AppWaterRoutesPage.vue`, `AppTicketTypesPage.vue`] |
| `useConfirmDialog`, `useNotifyAsyncAction`, `useNotifyErrorFromCatch` | Confirm + toast patterns | Use for destructive actions (delete template/slot) and async outcomes. [VERIFIED: `AppWaterRoutesPage.vue`, `AppTicketTypesPage.vue`] |

## Architecture Patterns

### System Architecture Diagram (Phase 1: authoring only)

```text
Staff user (admin UI)
  |
  v
Quasar Pages (Template Days + Slots)
  |  (local insert/update/delete)
  v
TanStack DB collections (template_days / template_day_slots / template_day_dates)
  |
  v
PowerSync upload queue (PUT/PATCH/DELETE; retry/offline replay)
  |
  v
Laravel POST /api/powersync/upload (transactional batch)
  |
  v
Eloquent models + DB (template_days, template_day_slots, template_day_dates)
```

### Recommended Project Structure (frontend)

Keep to existing conventions under `resources/js/`:

```text
resources/js/
├── pages/
│   ├── AppTemplateDaysPage.vue               # list + create template days (program-scoped)
│   └── AppTemplateDayEditPage.vue            # edit one template day + manage slots
├── models/
│   ├── template-days/
│   ├── template-day-slots/
│   └── template-day-dates/
├── components/
│   └── template-days/
│       ├── TemplateDaySlotForm.vue           # extracted slot editor form
│       └── TemplateDaySlotList.vue           # list/reorder slots
└── router/index.ts                           # add new routes under edit-context
```

### Pattern 1: Program-scoped CRUD pages (PowerSync collections)

**What:** Route is under `/programs/:programId/edit-context/*`. Router guard sets `program_scope` stream and Vue models filter by `program_id`.

**When to use:** Any admin entity that is program-scoped and should be editable offline (template days, slots).

**Example:** `useTemplateDays()` filters by `programSyncScopeIdRef` and inserts a ULID row locally, then drains outbox.

Source: [VERIFIED: `resources/js/models/template-days/template-days.model.ts`]

### Pattern 2: Quasar + vee-validate/zod form contract

**What:** Use `useForm({ validationSchema })` with `createQuasarFieldBinder(defineField)` and disable submit when `!meta.valid` or `isSubmitting`. For edit flows, use a dialog-based form (as in ticket types) or an inline form with commit-on-blur (as in water routes) depending on complexity.

**When to use:** Template day create/rename (simple) and slot edit (complex; likely dialog or dedicated edit page section).

Source: [VERIFIED: `AppWaterRoutesPage.vue`, `AppTicketTypesPage.vue`]

### Pattern 3: Time-of-day storage via `QTime` with seconds

**What:** Use Quasar `QTime` with `with-seconds` so the bound model string is `HH:mm:ss`, matching backend slot validation regex.

**When to use:** Slot `departure_time` editing.

Source: [CITED: https://quasar.dev/vue-components/time]

### Anti-Patterns to Avoid

- **Storing `departure_time` as an ISO timestamp in template slots:** Template slots represent a time-of-day, not a specific date/time; use `HH:mm:ss` string. [VERIFIED: `template_day_slots.departure_time` schema + DTO regex]
- **Letting the UI “auto-fix” program scoping via `user_id` filters:** Program scoping is via program scope/authorization; don’t invent per-user visibility rules. [VERIFIED: `.cursor/rules/no-user-id-scoping-fleet-entities.mdc`]
- **Hiding missing eager loads behind `loadMissing()` when adding API views later:** Add `with()` at query sites. [VERIFIED: `.cursor/rules/dto-eloquent-relations.mdc`]

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date picking (multi/range) | Custom calendar/date picker | Quasar `QDate` | Built-in string-mask model, range/multiple selection supported. [CITED: https://quasar.dev/vue-components/date] |
| Time input formatting | Manual masking/parsing | Quasar `QTime` (`with-seconds`, mask) | Produces correct `HH:mm`/`HH:mm:ss` model strings. [CITED: https://quasar.dev/vue-components/time] |
| Offline retry semantics | Custom “queue” implementation | PowerSync upload queue + idempotent backend | PowerSync can replay operations; backend must be idempotent. [CITED: https://docs.powersync.com/handling-writes/handling-update-conflicts] |

## Runtime State Inventory

Omitted (Phase 1 is not a rename/refactor/migration phase).

## Common Pitfalls

### Pitfall 1: Time string mismatch (`HH:mm` vs `HH:mm:ss`) breaks upload

**What goes wrong:** UI saves `departure_time` as `HH:mm` (common default) but backend requires `HH:mm:ss`, causing 422 validation failures or inconsistent storage.

**Why it happens:** Quasar `QTime` defaults to `HH:mm` unless `with-seconds` is enabled. [CITED: https://quasar.dev/vue-components/time]

**How to avoid:** Always bind slot time input via `QTime` `with-seconds` (or enforce a `mask="HH:mm:ss"`), and add a frontend unit test that verifies formatting.

**Warning signs:** Outbox commit errors show up after saving slot changes; backend responds 422 on PowerSync upload.

### Pitfall 2: UI implements TMPL-04/TMPL-05 without persisted schema

**What goes wrong:** “Ticket setup constraints” and “internal notes” exist only in UI state; offline edits disappear or never sync.

**Why it happens:** Current `template_day_slots` schema and DTOs do not include these fields. [VERIFIED: migration + DTOs]

**How to avoid:** Add persisted fields to `template_day_slots` (edit existing migration per rules), include them in PowerSync schema/downlink, and validate in server upload router + tests before building complex UI around them.

### Pitfall 3: Overloading a single mega-page for template authoring

**What goes wrong:** A single component mixes list, detail, slot form, ordering, and persistence orchestration, becoming fragile and hard to test (a known repo concern).

**Why it happens:** Existing concern: “Large page-level components with mixed concerns.” [VERIFIED: `.planning/codebase/CONCERNS.md`]

**How to avoid:** Split slot form/list into components; keep pages thin and composable.

## Code Examples (existing patterns to copy)

### PowerSync-backed “create row then drain outbox”

Source: [VERIFIED: `resources/js/models/template-days/template-days.model.ts`]

- Generate ULID (`ulid()`), insert into collection with `created_at/updated_at` ISO strings.
- Call `refreshOutboxSnapshot()` and `waitForUploadQueueDrained()` when appropriate (UI-specific).

### Quasar + vee-validate create form pattern

Source: [VERIFIED: `resources/js/pages/AppWaterRoutesPage.vue`]

- `useForm({ validationSchema, initialValues })`
- `createQuasarFieldBinder(defineField)` to generate `v-bind` props
- disable submit on `!meta.valid || isSubmitting`

## State of the Art (for this repo’s domain)

| Area | Current Approach | Why it matters |
|------|------------------|----------------|
| Safe local-first edits | PowerSync CRUD upload with server-side validation | Backend must be idempotent; UI should surface outbox commit errors. [CITED: https://docs.powersync.com/handling-writes/handling-update-conflicts] |
| Bulk scheduling operations | Command endpoints (preview/commit) rather than client fan-out | Keep Phase 1 focused; don’t leak apply semantics into CRUD UI. [VERIFIED: `.planning/research/ARCHITECTURE.md`] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Ticket setup constraints should be stored as a single JSON payload (e.g., `ticket_setup`) on `template_day_slots` for offline editing and later apply translation | Phase Requirements (TMPL-04) | If product needs normalized tables or a different shape, early schema choice may require migration + UI refactor |
| A2 | Slot internal notes can be modeled as a nullable string column (e.g., `internal_notes`) with a max length guard | Phase Requirements (TMPL-05) | If notes need rich text or separate audit history, later changes may be needed |

## Open Questions (RESOLVED)

1. **What is the canonical shape of “ticket setup constraints” for a template slot?**
   - What we know: Ticket types exist per program and have `trip_inventory_caps` JSON mapping trip-id → cap. [VERIFIED: `TicketType` model + migration]
   - What's unclear: Whether slot constraints mean “which ticket types are enabled”, “caps per ticket type”, “per-trip caps”, or other booking rules.
   - **Resolved decision (v1 canonical shape)**: Store `ticket_setup` as a JSON **object** (or null) with this minimal shape aligned to `001-UI-SPEC.md`:
     ```json
     {
       "policy": "defaults" | "custom",
       "allowed_ticket_type_ids": ["<ulid>", "..."],
       "min_per_booking": 1,
       "max_per_booking": 6,
       "notes": "optional short constraint note"
     }
     ```
     - When using defaults: store `ticket_setup=null` (preferred).
     - When custom: require `allowed_ticket_type_ids.length >= 1`.
     - Validate server-side: object-only (reject arrays/strings), enforce integer bounds, and cap payload size.

2. **Should Phase 1 include `template_day_dates` UI?**
   - What we know: `template_day_dates` exists and `useTemplateDayDates()` can create rows; roadmap says Phase 1 is authoring, not bulk apply. [VERIFIED: model module + ROADMAP]
   - What's unclear: Whether staff need a “where is this template used?” view now (which would read dates) or if that’s deferred.
   - **Resolved decision**: No `template_day_dates` UI in Phase 1. Phase 1 is authoring only; usage/linked dates belongs in later apply/preview phases.

## Environment Availability

Skipped (Phase 1 is internal code changes in an existing Laravel/Vite repo; no new external services required).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | PHPUnit (Laravel `php artisan test`) [VERIFIED: repo tests + AGENTS rules] |
| Frontend framework | Vitest + Testing Library Vue (`npm test`) [VERIFIED: `package.json`] |
| Quick backend command | `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest` [VERIFIED: existing test file] |
| Quick frontend command | `npm test -- --run resources/js/tests/**/*.test.ts` (or run full `npm test` if patterns vary) [ASSUMED] |
| Typecheck | `npm run typecheck` [VERIFIED: `package.json`] |
| Lint | `npm run lint` [VERIFIED: `package.json`] |

### Phase Requirements → Validations Map

| Req ID | Behavior | Check Type | Suggested Command / Method | Exists Today? |
|--------|----------|------------|----------------------------|--------------|
| TMPL-01 | Create template day for program | Backend feature test | `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest::test_put_creates_template_day_for_program_manager` | ✅ [VERIFIED: test file] |
| TMPL-02 | Create/edit slot with departure time | Backend feature test + frontend unit test | Backend: extend existing slot PUT test; Frontend: unit test time formatting to `HH:mm:ss` | Backend ✅ / Frontend ❌ [VERIFIED/ASSUMED] |
| TMPL-03 | Edit boat type/route/capacity per slot | Backend feature test + manual UI smoke | Backend: ensure PUT includes these; Manual: edit slot offline then refresh | Backend ✅ / Manual required |
| TMPL-04 | Persist ticket setup constraints per slot | Backend feature test + schema assertion | Add/extend PowerSync upload tests to cover JSON payload persistence + validation failures | ❌ (schema gap) [VERIFIED: missing fields] |
| TMPL-05 | Persist internal slot notes | Backend feature test + manual UI smoke | Add/extend tests for notes persistence + max length 422; Manual: offline edit + sync | ❌ (schema gap) [VERIFIED: missing fields] |

### Manual / UX Guardrails (Phase 1)

- **Outbox failure visibility:** Ensure pages show `outboxCommitError` banner (pattern exists) so staff understands offline/upload issues. [VERIFIED: `AppWaterRoutesPage.vue`]
- **Offline authoring smoke check:** Put browser offline, create template + slot, confirm UI reflects changes locally; reconnect and confirm outbox drains and backend persists.
- **Time boundary sanity checks:** Create slots at `00:00:00`, `23:59:59`, and around typical DST shift times (e.g. `01:30:00`, `02:30:00`) to ensure Phase 1 stores time-of-day without implicit timezone conversion in the UI.

### Wave 0 Gaps (to plan explicitly)

- [ ] Define the exact `ticket_setup` schema (zod + backend validation) and storage column type. [VERIFIED: missing]
- [ ] Add/extend frontend unit tests around slot time input formatting (`HH:mm:ss`). [ASSUMED]
- [ ] Ensure new template-day pages follow the repo’s “keep pages smaller” guidance (extract slot form/list). [VERIFIED: `.planning/codebase/CONCERNS.md`]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `POST /api/powersync/upload` requires authenticated user; router guard enforces `requiresAuth`. [VERIFIED: controller + router meta] |
| V4 Access Control | yes | Program membership checks on PowerSync upload actions; do not add `user_id` scoping for visibility. [VERIFIED: tests + `.cursor/rules/no-user-id-scoping-fleet-entities.mdc`] |
| V5 Input Validation | yes | Laravel Data DTO validation for upload payloads; zod validation for UI forms. [VERIFIED: DTO rules + existing zod usage] |
| V6 Cryptography | no | Not in Phase 1 scope (no new crypto). |

## Sources

### Primary (HIGH confidence)

- Quasar `QTime` (model mask, `with-seconds` → `HH:mm:ss`): `https://quasar.dev/vue-components/time` [CITED]
- Quasar `QDate` (string model, multiple/range selection): `https://quasar.dev/vue-components/date` [CITED]
- PowerSync conflict handling + idempotent write expectations: `https://docs.powersync.com/handling-writes/handling-update-conflicts` [CITED]
- Repo evidence for template entities + PowerSync upload tests: `app/Models/TemplateDay.php`, `app/Models/TemplateDaySlot.php`, `tests/Feature/PowerSyncUploadTemplateDayTest.php` [VERIFIED: repo files]
- Frontend PowerSync/TanStack patterns: `resources/js/powersync/app-powersync.runtime.ts`, `resources/js/models/template-days/template-days.model.ts` [VERIFIED: repo files]

### Secondary (MEDIUM confidence)

- Internal planning docs: `.planning/research/PITFALLS.md`, `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md` [VERIFIED: repo files]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (versions pinned in `package.json`)
- Architecture: HIGH for CRUD path; MEDIUM for ticket setup schema (not yet specified)
- Pitfalls: HIGH for time formatting + offline sync idempotency; MEDIUM for ticket constraint semantics

**Research date:** 2026-04-30  
**Valid until:** 30 days (repo-local conventions stable; ticket-setup semantics may change sooner)

## RESEARCH COMPLETE

---
phase: 1
slug: template-day-authoring-ui
status: draft
created: 2026-04-30
---

# Phase 1 — Research: Template Day Authoring UI

## What already exists in this repo (relevant primitives)

- **Program-scoped admin UI contexts**: routes under `/programs/:programId/edit-context/*` and nav via `AppProgramEditContextNav.vue`.
- **PowerSync local-first patterns**: bootstrapping gate via `getAppPowerSyncBootstrappedRef()` + `AppBootstrapGate`; outbox banner via `useAppPowerSyncOutbox()`.
- **Template entities exist (backend + local schema)**:
  - `template_days`, `template_day_slots`, `template_day_dates` tables exist and are synced.
  - Vue models exist: `useTemplateDays()`, `useTemplateDaySlots()`, `useTemplateDayDates()`.
  - Feature tests exist for uplink: `PowerSyncUploadTemplateDayTest`.

## Key gap for Phase 1

The current `template_day_slots` contract supports time/capacity/boat type/route only. Phase 1 requirements also need:

- **TMPL-04** ticket setup & constraints per slot
- **TMPL-05** internal notes per slot

So Phase 1 should include a schema + sync contract expansion, then the authoring UI.

## Data contract recommendations

- **`template_day_slots.internal_notes`**: nullable `text`, validated max length (recommend 2000).
- **`template_day_slots.ticket_setup`**: nullable `json` for slot-level ticket constraints.
  - Keep the structure flexible but validate it’s a JSON object.
  - UI can start with a small subset (allowed ticket types + min/max) and evolve later without re-migrating.

## Offline-first UX notes

- Prefer **optimistic writes** (insert/update locally immediately) and rely on the existing outbox UX to surface sync errors.
- For slot editor, use a dialog with explicit primary CTA (clarity). Avoid silent auto-save for complex fields.
- Sorting: store canonical `HH:MM:SS` to avoid mixed formats from browser time inputs.

## Validation Architecture

### Automated (backend)

- Extend `tests/Feature/PowerSyncUploadTemplateDayTest.php` to cover:
  - PUT `template_day_slots` with `internal_notes` + `ticket_setup`
  - 422 for overlong notes
  - 422 for invalid `ticket_setup` types

**Fast feedback command**:

- `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest`

### Manual (frontend)

Because there is no explicit frontend test harness referenced in this repo’s planning artifacts, do a smoke pass:

- Select a program → Edit context → Template days
- Create a template day
- Add 2–3 slots with varying times and capacity; set boat type/route; set custom ticket constraints; add notes
- Refresh/reopen app: values still show (local persistence)
- Simulate outbox error (disconnect) and confirm banner appears without losing form state

## Risks / pitfalls to remember (Phase 1 scoped)

- **Time normalization**: keep `departure_time` consistent; otherwise sorting + dedupe becomes fragile.
- **Ticket constraints creep**: keep the initial `ticket_setup` minimal and UI-driven; avoid modeling every business rule in v1.
- **Notes privacy**: ensure notes are clearly marked staff-only in copy (they are in admin, but still important).

## RESEARCH COMPLETE


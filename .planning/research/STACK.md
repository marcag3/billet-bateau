# Technology Stack

**Project:** Billet Bateau (template-day scheduling milestone)  
**Researched:** 2026-04-30  
**Scope:** Stack dimension only (subsequent milestone, existing platform already in place)

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Laravel | `^13.0` (already installed) | Bulk apply API + duplicate-safe persistence | Use Query Builder `upsert` with composite unique keys for race-safe idempotent apply. Official docs require primary/unique index alignment for upserts, which matches this milestone's duplicate-avoidance requirement. |
| Vue + Quasar | Vue `^3.5`, Quasar `^2.19` (already installed) | Template editor + date selection + apply confirmation UX | Keep UI inside existing Quasar conventions; avoids introducing another UI system and keeps PWA behavior coherent. |
| TanStack DB + Vue DB | `@tanstack/db ^0.6.5`, `@tanstack/vue-db ^0.0.116` (already installed) | Optimistic local scheduling state and preview diffs | Built-in optimistic mutation model and reactive live queries fit "safe but fast" apply UX (preview first, commit second). |
| PowerSync Web | `@powersync/web ^1.37.2` (already installed) | Offline writes + sync reconciliation | Existing sync path already in use. Write queue semantics and idempotent server processing are documented and align with bulk apply retries/offline replay. |

### Scheduling UI Layer
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Quasar `QDate` (core) | bundled | Multi-date selection for apply targets | Native Quasar component supports multiple/range selection and keeps dependency surface minimal. |
| `@quasar/quasar-app-extension-qcalendar` (optional, recommended when month/week grid is required) | `^4.1.2` (published 2025-02) | Rich calendar visualization (month/scheduler/resource views) | Best-fit in Quasar ecosystem if you need visual calendar slots, not just date picking. Prefer this over non-Quasar calendar libraries. |

### Persistence Safety (must-add schema adjustments)
| Change | Purpose | Why now |
|-------|---------|---------|
| Add composite unique index on `trips` for template-applied rows: `(program_id, template_day_slot_id, scheduled_departure_at)` | Hard-stop duplicate creation at DB level | App-level checks alone are race-prone under retry/offline replay; DB uniqueness is the safety net. |
| Keep apply endpoint idempotent using deterministic row IDs or stable unique key matching | Safe replays from offline queue | PowerSync operations can be retried; backend must tolerate duplicates cleanly. |

## Implementation Approach (Prescriptive)

1. **Client flow (Vue/Quasar/TanStack DB):**
   - Edit template slots in existing admin context routes.
   - Select target dates with `QDate` (`multiple` for arbitrary days; `range` when contiguous selection helps).
   - Run a **preflight** query (server-backed) returning `would_create`, `would_skip_duplicate`, and collision samples.
   - Require an explicit confirmation modal with exact counts before apply.
   - Apply action triggers one intent-based mutation (not per-row ad hoc UI writes), then sync/reconcile.

2. **Server flow (Laravel):**
   - Single bulk apply endpoint in staff admin API.
   - Wrap apply in DB transaction.
   - Build trip rows from template slots + selected dates.
   - Persist via `upsert` against the composite unique key.
   - Return deterministic summary: inserted, skipped, updated (only if override mode is explicitly requested later).

3. **Default conflict policy (v1 for this milestone):**
   - **Mode:** `skip-duplicates` (default and only mode in this milestone).
   - No silent overwrite of existing trips.
   - Any non-duplicate validation error fails the batch with actionable message; duplicates are counted and reported.

## Supporting Libraries Already Present (Use, don’t replace)

| Library | Current Version | Use in this milestone | When to Use |
|---------|-----------------|-----------------------|-------------|
| `zod` + `vee-validate` | `^4.3.6` + `^4.15.1` | Validate template slot payloads and apply request DTOs | Use on template form and apply confirmation payload before mutation dispatch. |
| `ulid` | `^3.0.2` | Stable client-generated identifiers where needed | Use for deterministic client row IDs if applying offline-created rows before server ack. |

## What NOT to Add (for this milestone)

| Avoid | Why Not | Do Instead |
|------|---------|------------|
| Full recurrence engine (RRULE/cron-like scheduling) | Over-scopes milestone and adds complex edge cases (holidays/exceptions/timezones) | Keep explicit template-day + explicit selected dates. |
| FullCalendar/Radix/another UI framework | Duplicates Quasar capabilities and increases maintenance surface | Use Quasar `QDate`; add Quasar QCalendar extension only if richer calendar grid is truly required. |
| New sync engine or offline store | Existing TanStack DB + PowerSync stack already matches local-first requirements | Stay on current sync pipeline; harden idempotency and constraints instead. |
| “insertOrIgnore everywhere” strategy | Laravel docs warn ignored errors can mask non-duplicate failures depending on DB engine | Prefer explicit `upsert` + unique indexes + clear batch result reporting. |
| Background job orchestration for apply | Adds operational complexity before proving need | Execute synchronously in one transactional request; revisit async only if payload size warrants it. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Calendar UX | Quasar `QDate` (+ optional QCalendar extension) | Third-party non-Quasar calendar components | We already run Quasar-first admin UI and PWA shell; cross-library UI complexity is unnecessary here. |
| Duplicate prevention | DB unique index + Laravel `upsert` | Client-only duplicate filtering | Client-only checks are insufficient under concurrent apply/retries. |
| Apply semantics | Default skip-duplicates with explicit summary | Auto-overwrite existing trips | Conflicts with milestone safety goal and increases accidental data loss risk. |

## Installation (Only if richer calendar views are needed)

```bash
# Optional: richer scheduler/month views in Quasar ecosystem
npm install @quasar/quasar-app-extension-qcalendar
```

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Laravel bulk apply + duplicate safety | HIGH | Official Laravel Query Builder docs cover upsert semantics and unique index requirements. |
| TanStack DB optimistic scheduling UX | HIGH | Official TanStack DB docs clearly describe optimistic mutations + sync loop. |
| PowerSync retry/idempotency expectations | HIGH | Official PowerSync docs explicitly describe queued PUT/PATCH/DELETE and idempotent backend handling. |
| Quasar calendar component choice | MEDIUM-HIGH | Official Quasar docs strongly support `QDate`; QCalendar extension viability is supported by npm/repo docs but is an extension, not core. |

## Sources

- Laravel Query Builder (`upsert`, `insertOrIgnore`): https://laravel.com/docs/13.x/queries#upserts  
- TanStack DB Overview: https://tanstack.com/db/latest/docs/overview  
- TanStack DB Mutations Guide: https://tanstack.com/db/latest/docs/guides/mutations  
- PowerSync Writing Data: https://docs.powersync.co/client-sdks/writing-data  
- PowerSync Custom Conflict Resolution: https://docs.powersync.co/handling-writes/custom-conflict-resolution  
- Quasar `QDate`: https://quasar.dev/vue-components/date  
- Quasar QCalendar extension (package): https://www.npmjs.com/package/@quasar/quasar-app-extension-qcalendar  

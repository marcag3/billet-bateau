---
phase: 1
slug: template-day-authoring-ui
status: draft
created: 2026-04-30
design_system: quasar-vue3
offline_first: true
---

# Phase 1 — Template Day Authoring UI (UI Design Contract)

> Staff/admin-only authoring experience to create and update reusable template days with complete slot details. This contract is optimized for clarity, safety, and offline-first sync behavior.

---

## Design System

| Property | Value |
|----------|-------|
| UI framework | Quasar (Vue 3) |
| Layout primitives | `q-layout`, `q-page`, `AppEntityIndexPageLayout`, `AppEntityEditPageLayout`, `AppBootstrapGate` |
| Form validation | `vee-validate` + existing Quasar field binder pattern (`createQuasarFieldBinder`) |
| Notifications | `useNotifyAsyncAction` (success/error toasts) + `AppAlertBanner` |
| Sync UX primitive | Header “Pending sync” menu (`AppOutboxToolbarMenu`) + optional in-page banners |
| Icon set | Material Icons (Quasar `q-icon`) |
| Font | Quasar default (Roboto/system) |

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon gaps, dense chips |
| sm | 8px | Tight form spacing inside cards |
| md | 16px | Default spacing between inputs/rows |
| lg | 24px | Card section padding, major groups |
| xl | 32px | Page-level group separation |
| 2xl | 48px | Rare: empty states / big breaks |

Exceptions:
- Touch targets: minimum 44px height for primary actions and icon-only buttons (mobile safety).

---

## Typography

Exactly four roles:

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label / helper | 14px | 400 | 1.4 |
| Heading (page/cards) | 20px | 600 | 1.2 |
| Display (empty states) | 28px | 600 | 1.15 |

---

## Color

Use existing app shell colors as source of truth (from `AppLayout.vue`).

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#f6f8ff` | Page background gradients/surfaces |
| Secondary (30%) | `#ffffff` | Cards, form panels, tables |
| Accent (10%) | `#ea1d2c` | Primary CTAs, active nav item indicator, “Add slot” button |
| Destructive | Quasar `negative` (fallback `#c62828`) | Delete actions and destructive confirmations only |

Accent reserved for:
- Primary CTAs: “Create template day”, “Save changes”, “Add slot”, “Save slot”
- Active navigation state (existing pattern)
- High-signal inline status chips (only for “Pending sync” and “Needs review”)

---

## Information Architecture (Navigation / Routes)

### Where it lives
- Template day authoring is **program-scoped** and belongs in the existing **Edit Context** nav (`AppProgramEditContextNav.vue`).
- Add a left-nav item between **Trips** and **Ticket types**:
  - Label: **Template days**
  - Icon: `calendar_month` (or `event_note` if unavailable)

### Route contracts
- **Template days list**: `/programs/:programId/edit-context/template-days`
  - Route name: `template-days.list`
- **Template day edit**: `/programs/:programId/edit-context/template-days/:templateDayId/edit`
  - Route name: `template-days.edit`
- Optional (allowed): **Template day create** as a **modal/dialog** on the list page (preferred) to avoid an extra route.

### Header/title contracts
- Set document title via existing override mechanism:
  - List: “Template days”
  - Edit: “Edit template day”

---

## Key Screens

### Screen A — Template days list (per program)

**Purpose**
- Create a new template day (TMPL-01).
- Browse existing template days and open one to edit.

**Layout**
- Use `AppEntityIndexPageLayout` with:
  - Title: “Template days”
  - Description: “Reusable day patterns for scheduling. Changes sync through PowerSync.”
- Primary action button at top right:
  - **CTA**: “New template day”
  - Opens a dialog (preferred) with a single input (name).

**List content**
- Use a `q-list` or `q-table` (choose based on existing patterns; both acceptable). Each row/card shows:
  - Template day name
  - Slot count (computed from slots collection)
  - Last updated (optional if already available)
  - Actions:
    - **Edit** (primary row action)
    - **Delete** (secondary, destructive)

**Empty state**
- Heading: “No template days yet”
- Body: “Create one to start defining a typical day of departures for this program.”
- Action: “New template day”

**Delete confirmation**
- Title: “Delete template day?”
- Message: `Remove "{name}"? This cannot be undone.`
- Confirm CTA: “Delete”
- Cancel CTA: “Cancel”

**Offline/sync signals**
- If there are pending outbox writes, show a small non-blocking banner at top:
  - “Pending sync: your changes will upload when you’re back online.”
  - Dismissible.

---

### Screen B — Template day edit (template details + slot editor)

**Purpose**
- Update template day name.
- Create/edit/delete/reorder slots with complete operational details (TMPL-02..TMPL-05).

**Layout**
- Use `AppEntityEditPageLayout`:
  - Back to list: “Back to template days”
  - Title: “Edit template day”
  - Description: “Update departures, capacity, and constraints. Changes are saved locally and sync in the background.”
- Alerts slot:
  - Show `AppAlertBanner` when `useAppPowerSyncOutbox().hasOutboxCommitError` is true (reuse existing pattern from trips pages).

**Sections**
1. **Template day details** (`AppCardSection`)
   - Field: **Name** (required)
   - Inline save behavior:
     - Preferred: explicit “Save changes” button (clarity) rather than auto-save on blur.
2. **Slots** (`AppCardSection`)
   - Header actions:
     - Primary: “Add slot”
     - Secondary: “Reorder” toggle (optional; may be always-on if simple)

**Slots list presentation**
- Display each slot as a card-like row with:
  - Departure time (prominent)
  - Boat type (label or “Any”)
  - Water route (label or “None”)
  - Capacity
  - Ticket constraints summary (e.g., “Tickets: program defaults” / “Tickets: custom”)
  - Notes indicator (icon + “Notes” if present)
  - Inline status chip (only when applicable):
    - “Pending sync”
    - “Sync error” (only if this row is implicated; otherwise rely on global banner)
- Row actions:
  - Edit (opens slot editor dialog or inline expand)
  - Delete (destructive)

**Ordering**
- `sort_order` is authoritative. UX contract:
  - Provide at least **Up/Down** controls (always available).
  - If drag-and-drop is implemented, it must still be keyboard-accessible (fallback Up/Down).

---

## Slot Editor (Add/Edit Slot)

Use a `q-dialog` containing a `q-form` with a clear title:
- Add: “Add slot”
- Edit: “Edit slot”

### Fields (required unless noted)

**Core**
- **Departure time** (`departure_time`)
  - Input: time picker (HH:MM) mapped to stored `HH:MM:SS`
  - Required
- **Capacity** (`capacity`)
  - Input: number
  - Required; positive integer \( \ge 1 \)
- **Boat type** (`boat_type_id`, optional)
  - Input: `q-select` clearable; options from boat types in program
  - Empty label: “Any boat type”
- **Water route** (`water_route_id`, optional)
  - Input: `q-select` clearable; options from water routes in program
  - Empty label: “No route”

**Ticket setup & constraints (TMPL-04)**
- Present as a dedicated card subsection labeled “Ticket setup”.
- Control: radio/select **Ticket policy**
  - “Use program defaults” (default)
  - “Custom constraints”
- When “Custom constraints” is selected, show:
  - **Allowed ticket types** (multi-select)
    - Required when in custom mode; empty is invalid
  - **Min per booking** (integer, default 1)
  - **Max per booking** (integer, optional; if set must be \( \ge \) min)
  - **Notes for constraints** (optional short helper text; not internal ops notes)

**Internal notes (TMPL-05)**
- Field: **Internal notes**
  - Input: multiline text area
  - Helper: “Visible to staff only. Use for operational details (boarding, timing, exceptions).”

### Slot editor actions
- Primary CTA (add): “Add slot”
- Primary CTA (edit): “Save slot”
- Secondary: “Cancel”
- If delete is inside editor (optional), it must be separated and styled as destructive.

---

## Validation UX Contract

### General rules
- Validate on blur and on submit; show inline error text under fields (Quasar standard).
- Disable primary CTA while submitting and when form is invalid (`!meta.valid || isSubmitting` pattern).
- Use clear, localized error messages (same tone as existing `en.ts` strings: short, direct).

### Field rules
- Template day name:
  - Required, trimmed, min length 1
  - Error: “Name is required.”
- Departure time:
  - Required
  - Must parse as local time; store canonical `HH:MM:SS`
  - Error: “Departure time is required.”
  - Error invalid: “Enter a valid time.”
- Capacity:
  - Required, integer, \( \ge 1 \)
  - Error: “Capacity is required.”
  - Error invalid: “Capacity must be a positive integer.”
- Ticket constraints (custom mode only):
  - Allowed ticket types required: “Select at least one ticket type.”
  - Max \( \ge \) min if max is set: “Maximum must be greater than or equal to minimum.”

### Cross-field warnings (non-blocking)
- If boat type is set but route is empty (or vice versa), allow save but show a subtle helper warning:
  - “Tip: Set both boat type and route for clearer operations.”

---

## Loading, Empty, Error States

### Bootstrap/loading
- All Template Day pages must be wrapped in `AppBootstrapGate` using the same “ready” semantics as other entity pages (PowerSync bootstrapped ref).
- While loading, show skeleton placeholders (cards/rows) rather than spinners.

### Not found
- If a template day id is missing or not in the selected program scope:
  - Show a friendly not-found panel:
    - Title: “Template day not found”
    - Body: “It may have been removed or you may not have access.”
    - Action: “Back to template days”

### Generic error handling
- For unexpected failures (validation exceptions from sync apply, local parse issues):
  - Toast: “Something went wrong. Please try again.”
  - Keep user input where possible (do not clear forms on failure).

---

## Offline-First / Sync State Contract

### Optimistic UI
- All create/edit/delete actions apply immediately to the local store (PowerSync collections) and reflect in UI instantly.
- After each write, refresh outbox snapshot to update the header counter (existing pattern).

### Pending sync visibility
- Global: the existing header “Pending sync” is the primary indicator.
- In-page (recommended):
  - Show a compact banner when outbox pending count \(> 0\):
    - “Pending sync: changes are saved locally and will upload automatically.”

### Sync error visibility
- If an outbox commit error exists:
  - Show `AppAlertBanner` at top of page:
    - Copy should match current sync message tone (non-alarming, reassuring):
    - “Could not sync a pending change to the server yet. Your edit is still queued locally; you can try again.”
  - Provide a dismiss action (“Dismiss”).

### Latency resilience
- Never block editing because the network is slow/unavailable.
- Only block when the local persistence layer is unavailable (existing “persistenceLimited” messaging).

---

## Copywriting Contract (Phase 1)

All strings must be localizable (add to `resources/js/utilities/locales/en.ts` + `fr.ts` later).

| Element | Copy |
|---------|------|
| Primary CTA (list) | “New template day” |
| Primary CTA (create dialog) | “Create template day” |
| Primary CTA (edit page) | “Save changes” |
| Primary CTA (slot add) | “Add slot” |
| Primary CTA (slot edit) | “Save slot” |
| Empty state heading (list) | “No template days yet” |
| Empty state body (list) | “Create one to start defining a typical day of departures for this program.” |
| Empty state heading (slots) | “No slots yet” |
| Empty state body (slots) | “Add a slot to define a departure time, capacity, and optional boat type and route.” |
| Error state (generic) | “Something went wrong. Please try again.” |
| Destructive confirmation | Template day: `Delete template day?` / `Remove "{name}"? This cannot be undone.`; Slot: `Delete slot?` / `Remove the {time} departure? This cannot be undone.` |

---

## Phase Acceptance Checklist (UI)

- [ ] TMPL-01: Create template day for selected program and see it persist in list immediately
- [ ] TMPL-02: Add/edit slots with departure time; reflects immediately in slot list
- [ ] TMPL-03: Boat type, route, capacity selectable per slot and visible in summary rows
- [ ] TMPL-04: Ticket setup subsection exists per slot with defaults + custom mode and validation
- [ ] TMPL-05: Internal notes field exists per slot; visible indicator in slot summary; editable
- [ ] Offline-first: All edits are optimistic; pending sync + sync error states are visible and non-blocking

---

## UI-SPEC COMPLETE

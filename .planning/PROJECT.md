# Billet Bateau

## What This Is

Billet Bateau is a local-first, offline-capable Laravel + Vue app for staff to manage boat-trip operations and booking workflows. It already supports core program configuration and trip-related data models, and now needs stronger scheduling UX in the admin interface. The current focus is enabling staff to quickly craft a "typical day" of trips and apply it safely to selected calendar days.

## Core Value

Staff can confidently create and manage trip schedules quickly, with clear UI and safe bulk actions.

## Requirements

### Validated

- ✓ Staff can manage programs and core catalog entities (boats, boat types, routes, trips)
- ✓ Public read-only program catalog is available without login
- ✓ Existing data and sync foundations support template-day entities and trip scheduling fields

### Active

- [ ] Staff can create and edit template days in the admin UI
- [ ] Staff can define template slots including time, boat type, route, capacity, ticket setup, and notes
- [ ] Staff can apply a template day to multiple selected calendar dates
- [ ] Applying templates avoids duplicate trips on target dates
- [ ] Staff sees clear, low-risk confirmations before scheduling changes are applied

### Out of Scope

- Public-facing template scheduling controls — staff-only scope for this milestone
- Payment workflow additions during template scheduling work — not part of this UI milestone

## Context

The project already contains backend and sync work for template day structures, but frontend scheduling UX is not implemented yet. Admin users need a practical way to turn operational patterns into repeatable day templates and apply them to calendar dates without creating accidental duplicates. The user prioritizes safety and clarity over maximum scheduling speed, while still expecting quick creation in normal workflows.

## Constraints

- **User Scope**: Staff-only admin workflow — no public UI changes required
- **Safety**: Template apply flow should avoid duplicates by default
- **UX Goal**: Clear and confidence-inspiring interactions for schedule changes
- **Product Direction**: Implement existing template-day capability in frontend before broader scheduling expansions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build template-day scheduling UX now | Backend/sync foundations already exist; this is the biggest current gap | — Pending |
| Include full slot details in v1 template UI | Staff need realistic "typical day" definitions, not minimal placeholders | — Pending |
| Multi-date apply is required in v1 | Bulk assignment is core to quick creation | — Pending |
| Default conflict handling should avoid duplicates | User expects conflicts to be rare, but wants safe outcomes when they happen | — Pending |
| Prioritize safe changes and clarity | User explicitly values low-risk workflows and clear UI | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-30 after initialization*

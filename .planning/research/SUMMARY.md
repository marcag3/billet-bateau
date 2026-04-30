# Project Research Summary

**Project:** Billet Bateau
**Domain:** Staff-facing local-first template-day scheduling
**Researched:** 2026-04-30
**Confidence:** HIGH

## Executive Summary

Billet Bateau is an offline-capable staff operations product where the immediate gap is not data modeling but safe scheduling execution: staff need to define reusable "typical day" templates and apply them to many dates without accidental duplicates or unclear outcomes. The research converges on a pattern used by mature scheduling systems: keep day-to-day editing fast and local-first, but treat bulk scheduling as a controlled, server-owned command with explicit preview and commit steps.

The recommended approach is a hybrid model. Continue PowerSync + TanStack DB for template CRUD and normal row edits, then introduce Laravel preview/commit bulk endpoints with idempotency keys, deterministic summaries, and DB-backed uniqueness guarantees. On the UI side, keep Quasar-first components (`QDate`, dialog-based confirmation) and separate editor state from apply-wizard state so "editing templates" and "executing bulk changes" cannot contaminate each other.

The dominant risks are duplicate creation on retries/offline replay, accidental wide-scope applies, hidden conflict behavior, and timezone boundary drift. Mitigation is clear and must be implemented early: composite uniqueness + `upsert`, mandatory preflight preview with exact date impact, explicit non-destructive default conflict mode, and timezone/boundary test coverage before rollout.

## Key Findings

### Recommended Stack

The stack recommendation is additive and conservative: use the existing Laravel + Vue/Quasar + TanStack DB + PowerSync platform and harden bulk apply behavior instead of introducing new frameworks. For this milestone, technical success comes from robust write semantics and UX guardrails, not from expanding platform surface area.

**Core technologies:**
- Laravel 13: transactional preview/commit command APIs with `upsert` and unique-index safety.
- Vue 3 + Quasar 2: template editing, date targeting, and explicit confirmation UX inside existing conventions.
- TanStack DB + Vue DB: optimistic local CRUD and reactive scheduling state.
- PowerSync Web: offline queueing/replay with backend idempotency compatibility.
- PostgreSQL uniqueness constraints: last-line duplicate prevention under retries and concurrency.

### Expected Features

The feature set is clear: table-stakes are about trust and control in bulk edits; differentiators improve operator confidence and auditability after baseline safety exists.

**Must have (table stakes):**
- Template creation/editing with full slot details for realistic operational reuse.
- Multi-date apply in one action (not date-by-date manual repetition).
- Pre-apply confirmation summary with create/skip/conflict counts.
- Explicit conflict handling with safe defaults (avoid duplicates by default).
- Draft/publish/revert safety loop to reduce fear of high-impact edits.
- Inline warnings for known conflicts before commit.

**Should have (competitive):**
- Impact diff grouped by date/slot before commit.
- Dry-run simulation and post-apply operation receipt.
- Guided apply wizard with progressive disclosure.
- Exception overlay (holidays/events) during date selection.

**Defer (v2+):**
- Fully automated conflict resolution without review.
- AI/autofill optimization in scheduling decisions.
- Full recurrence engine and advanced calendar intelligence.
- Broad role-matrix redesign tied to this milestone.

### Architecture Approach

Research strongly supports a hybrid CQRS shape: keep CRUD and local-first interactions on the PowerSync upload path, but move dangerous bulk apply into explicit command endpoints (`preview`, `commit`) owned by Laravel. Maintain program-scoped authorization via membership/capabilities (not `user_id` visibility scoping), and keep three frontend boundaries: template editor state, calendar selection state, and apply wizard state.

**Major components:**
1. Laravel template catalog CRUD — validates template entities and invariants.
2. Laravel bulk apply service — deterministic preview and transactional idempotent commit.
3. Conflict policy layer — default skip-duplicates semantics with explicit destructive override.
4. PowerSync program stream — converges applied results across clients/offline sessions.
5. Vue scheduling orchestrator + Quasar dialogs — two-phase user confirmation and feedback lifecycle.

### Critical Pitfalls

1. **Non-idempotent apply retries create duplicates** — prevent via operation IDs, stable keys, DB uniqueness, and `upsert`.
2. **Ambiguous apply scope causes accidental blast radius** — require preview and explicit "Apply to N dates" confirmation.
3. **Hidden conflict policy erodes trust** — show explicit outcome buckets and use non-destructive default mode.
4. **Timezone/boundary errors shift schedules** — enforce canonical program timezone and DST/end-boundary tests.
5. **Offline/concurrent writes lose intent** — use operation-level conflict semantics and deterministic per-item outcomes.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Apply Engine Integrity and Time Contract
**Rationale:** All downstream UX depends on deterministic server behavior and correct temporal identity.  
**Delivers:** Duplicate-key contract, idempotency keys, DB unique indexes, transactional apply primitives, canonical timezone rules, DST/boundary tests.  
**Addresses:** Multi-date safe apply, duplicate avoidance, confidence in correctness.  
**Avoids:** Duplicate replay bugs, timezone off-by-one drift.

### Phase 2: Preview/Commit API and Conflict Contract
**Rationale:** Before UI rollout, backend must provide stable preview semantics and explicit conflict outcomes.  
**Delivers:** Program-scoped `preview` and `commit` endpoints, preview token/hash binding, deterministic result buckets (`create`, `skip_duplicate`, `conflict`).  
**Uses:** Laravel 13 query builder + transactions + unique constraints.  
**Implements:** Server-owned dangerous operations pattern.

### Phase 3: Template-Day UI and Safe Apply Wizard
**Rationale:** With backend guarantees in place, implement the staff-facing flow that converts template intent into controlled calendar changes.  
**Delivers:** Template editor, multi-date selector (`QDate`), preview dialog, explicit confirmation copy, commit lifecycle UX and result receipt.  
**Addresses:** Table-stakes UX expectations and low-risk interaction goals.  
**Avoids:** Ambiguous scope and hidden behavior.

### Phase 4: Offline Reconciliation and Template Evolution Semantics
**Rationale:** Once core flow works, harden concurrent/offline behavior and prevent exception sprawl from future updates.  
**Delivers:** Operation-status sync behavior, outbox visibility for commit state, template version linkage, split-at-boundary update semantics.  
**Addresses:** Local-first consistency and predictable ongoing maintenance.  
**Avoids:** Lost-intent conflicts and fragmented schedule state.

### Phase 5: Safety Net and Observability
**Rationale:** Adoption at scale requires fast recovery and measurable confidence signals.  
**Delivers:** Batch undo entrypoint/guardrails, apply operation audit trail, metrics (`created/skipped/conflicted`), duplicate-rate alerts, retry/concurrency regression tests.  
**Addresses:** Operational trust and supportability.  
**Avoids:** Silent regressions and irreversible bulk mistakes.

### Phase Ordering Rationale

- Integrity rules first because every later phase assumes deterministic apply semantics.
- Preview/commit API precedes UI so frontend can bind to stable contracts instead of inventing temporary logic.
- UI implementation is grouped after backend primitives to reduce rework and avoid client fan-out anti-patterns.
- Offline evolution and operational safeguards are sequenced after baseline workflow validity, but before broad rollout.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4:** Offline reconciliation details (operation-status materialization and outbox UX under blocking FIFO conditions).
- **Phase 5:** Undo strategy and guardrails (legal/operational constraints on destructive rollback).

Phases with standard patterns (can usually skip additional research-phase):
- **Phase 1:** Idempotency + uniqueness + timezone testing are well-documented in Laravel/PostgreSQL practice.
- **Phase 2:** Preview/commit command endpoint pattern is established and directly supported by current architecture.
- **Phase 3:** Quasar wizard/dialog flow with date multi-select is straightforward given existing stack.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based primarily on official Laravel, PowerSync, TanStack, and Quasar documentation plus existing project stack fit. |
| Features | HIGH | Table-stakes strongly corroborated by scheduling product docs; differentiators are consistent but somewhat product-opinionated. |
| Architecture | HIGH | Strong alignment with current codebase boundaries and established local-first + command pattern guidance. |
| Pitfalls | HIGH | Risks recur across official sync/calendar/database docs and map directly to this milestone's failure modes. |

**Overall confidence:** HIGH

### Gaps to Address

- **Conflict key finalization:** Research proposes candidate duplicate keys; planning must lock exact uniqueness dimensions for business semantics.
- **Rollback policy scope:** Need explicit product decision on how far undo can go and under which permissions/retention window.
- **Async vs sync commit choice:** If apply payloads grow, planning must decide when to introduce async operation tracking table.

## Sources

### Primary (HIGH confidence)
- Laravel 13 Query Builder docs (`upsert`, `insertOrIgnore`) — bulk write semantics and constraints.
- PowerSync docs (write handling, consistency, conflict handling, sync rules/streams) — offline replay and conflict behavior.
- TanStack DB mutation/docs — optimistic local-first behavior and mutation lifecycle.
- PostgreSQL docs (constraints, transaction isolation) — uniqueness and concurrent write safety.
- Project context and architecture artifacts (`.planning/PROJECT.md`, PowerSync runtime/config, upload router).

### Secondary (MEDIUM confidence)
- Quasar docs (`QDate`, dialog patterns) — implementation guidance for date selection and confirmation UX.
- Official scheduling help centers (When I Work, Restaurant365, Easyteam, Scheduling+) — table-stakes and operational patterns.

### Tertiary (LOW confidence)
- UX heuristic references (e.g., slip-prevention principles) used only to reinforce confirmation/default recommendations.

---
*Research completed: 2026-04-30*
*Ready for roadmap: yes*

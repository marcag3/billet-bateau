# Domain Pitfalls: Template-Day Scheduling UX

**Domain:** Staff admin template-based calendar scheduling (local-first/offline-capable)
**Researched:** 2026-04-30
**Scope:** Mistakes to avoid when adding template-day creation and bulk apply flows to an existing admin system.

## Critical Pitfalls

### Pitfall 1: Non-idempotent bulk apply creates duplicates
**What goes wrong:** Re-running the same apply action (retry, reconnect, double-submit) inserts duplicate trips for the same date/time slot.

**Warning signs:**
- Duplicate trips appear with near-identical fields on the same date.
- Retry behavior after offline reconnect creates extra rows.
- Users report "I clicked once but got two departures."

**Prevention strategy:**
- Make apply operations idempotent end-to-end (`operation_id` + deterministic target keys).
- Enforce database uniqueness for "same scheduled trip identity" (not UI-only dedupe).
- Use `INSERT ... ON CONFLICT`/upsert semantics for create-or-skip behavior.
- Store and expose apply batch IDs for traceability and rollback.

**Suggested phase to address:** **Phase 1 - Apply engine integrity (idempotency + constraints)**

---

### Pitfall 2: Ambiguous bulk scope causes accidental over-application
**What goes wrong:** Users think they are applying to a few dates, but action affects a larger range or wrong set.

**Warning signs:**
- Frequent "I did not mean to apply to all those dates" support incidents.
- High cancellation/edit churn immediately after bulk apply.
- Users hesitate to use bulk apply and fall back to manual day edits.

**Prevention strategy:**
- Require an explicit preview step with: selected dates, per-date create/skip counts, and conflict summary.
- Show date chips/list and template name/version in final confirmation.
- Use explicit CTA copy: "Apply template to 12 dates" (never generic "Apply").
- Keep defaults safe (e.g., "skip duplicates"), with advanced options behind a secondary control.

**Suggested phase to address:** **Phase 2 - Bulk apply UX and confirmation design**

---

### Pitfall 3: Hidden conflict policy (overwrite vs skip) erodes trust
**What goes wrong:** System silently overwrites existing schedule data or silently skips intended changes.

**Warning signs:**
- Users cannot explain why some target dates changed and others did not.
- Same operation yields different outcomes depending on hidden state.
- Repeated manual fixes after each template apply.

**Prevention strategy:**
- Define one default conflict mode aligned with product safety goal (default: duplicate-resistant, non-destructive).
- Always present impact summary by outcome bucket: `create`, `skip_duplicate`, `conflict_requires_review`.
- Make destructive options explicit and high-friction (extra confirmation).
- Persist per-row apply result status for auditability.

**Suggested phase to address:** **Phase 2 - Conflict UX contract + explicit apply modes**

---

### Pitfall 4: Per-instance edits explode into exception clutter
**What goes wrong:** Bulk operations edit many individual instances directly, producing fragmented schedule state that is hard to reason about and slow to maintain.

**Warning signs:**
- Many one-off exceptions after each "future update."
- Growing latency and confusing calendar state over time.
- Staff cannot predict what "template update" will touch.

**Prevention strategy:**
- Treat template application as series-level intent, not many ad-hoc instance mutations.
- For "this and following" changes, split at boundary instead of patching each future instance.
- Keep explicit linkage from generated trips back to template slot/version metadata.

**Suggested phase to address:** **Phase 3 - Template versioning and update semantics**

---

### Pitfall 5: Time-zone and end-boundary mistakes cause off-by-one schedules
**What goes wrong:** Trips appear on wrong day/time due to mixed timezone handling or misunderstanding exclusive end boundaries.

**Warning signs:**
- Events shift by one hour around DST transitions.
- Last intended day is missing (exclusive end interpreted as inclusive).
- Different admins see inconsistent placement.

**Prevention strategy:**
- Standardize one canonical program timezone for scheduling decisions.
- Persist schedule identity in canonical form (program-local date + local departure time + timezone context).
- Add DST boundary tests and end-boundary tests for template ranges.
- In UI, label boundary semantics clearly (e.g., "End date is inclusive in UI" while backend maps correctly).

**Suggested phase to address:** **Phase 1 - Time model and calendar contract**

---

### Pitfall 6: Offline/concurrent writes create race-condition conflicts
**What goes wrong:** Multiple staff (or one offline staff user) apply overlapping changes; last-write-wins unintentionally clobbers intent.

**Warning signs:**
- "My schedule disappeared after sync" reports.
- Apply results differ between online and offline sessions.
- Conflicts are only discovered by manual visual inspection.

**Prevention strategy:**
- Define conflict semantics for apply operations, not just row-level patches.
- Use operation-level dedupe and conflict detection before mutation commit.
- Return deterministic per-item outcomes and sync them back to clients.
- Provide a recovery path (replay/rollback by batch ID).

**Suggested phase to address:** **Phase 4 - Offline conflict policy and reconciliation**

## Moderate Pitfalls

### Pitfall 7: No operational undo for high-impact applies
**What goes wrong:** Fear of irreversible mistakes slows usage and encourages manual workflows.

**Warning signs:**
- Staff avoid bulk apply in production periods.
- "Can we undo this?" becomes a recurring urgent request.

**Prevention strategy:**
- Implement reversible apply batches (delete/revert by batch ID under guardrails).
- Offer a short-lived "undo" action in post-apply feedback.

**Suggested phase to address:** **Phase 5 - Safety net (undo + audit tooling)**

### Pitfall 8: Weak observability hides duplicate regressions
**What goes wrong:** Duplicate or conflict regressions are found late, after schedule data has propagated.

**Warning signs:**
- No metrics for apply outcomes (`created/skipped/conflicted`).
- Duplicate incidents discovered only through staff complaints.

**Prevention strategy:**
- Track apply outcome metrics and alert on abnormal duplicate/skip rates.
- Log operation IDs, actor, target date set, and result summary.
- Add test fixtures for retry/reconnect/concurrent-apply scenarios.

**Suggested phase to address:** **Phase 5 - Monitoring and regression protection**

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Apply engine integrity | Duplicate rows on retries/reconnect | Idempotent operation IDs + DB unique constraints + upserts |
| Bulk apply UX | Accidental wide-scope changes | Preview diff + explicit confirmation copy with date counts |
| Conflict handling | Silent overwrite/skip behavior | Explicit outcome buckets + safe default mode |
| Template evolution | Exception sprawl | Versioned template linkage + split-at-boundary updates |
| Time handling | DST/off-by-one date drift | Canonical timezone + boundary test suite |
| Offline sync | Lost intent in concurrent updates | Operation-level conflict policy + replay/rollback paths |
| Safety net | Irreversible bulk mistakes | Batch undo capability + audit trail |
| Observability | Hidden regressions | Outcome metrics + alerts + concurrency test coverage |

## Sources

- PowerSync docs, handling update conflicts (official): https://docs.powersync.com/handling-writes/handling-update-conflicts **(HIGH)**
- PowerSync docs, sync rules and bucket model (official): https://docs.powersync.com/usage/sync-rules **(HIGH)**
- FullCalendar docs, event object (`id`, exclusive end behavior): https://fullcalendar.io/docs/event-object **(HIGH)**
- FullCalendar docs, recurring events (`endRecur` exclusive, grouping): https://fullcalendar.io/docs/recurring-events **(HIGH)**
- FullCalendar docs, timezone behavior and UTC-coercion caveats: https://fullcalendar.io/docs/timeZone **(HIGH)**
- Google Calendar API recurring events guide (instance modification warning, split-series approach): https://developers.google.com/calendar/api/guides/recurringevents **(HIGH)**
- PostgreSQL docs, constraints (unique/exclude guidance): https://www.postgresql.org/docs/current/ddl-constraints.html **(HIGH)**
- PostgreSQL docs, transaction isolation and `ON CONFLICT` behavior in read committed: https://www.postgresql.org/docs/current/transaction-iso.html **(HIGH)**
- NN/g, preventing slip errors (confirmation constraints/defaults framing): https://www.nngroup.com/articles/slips/ **(MEDIUM)**

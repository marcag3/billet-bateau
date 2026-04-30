# Requirements: Billet Bateau

**Defined:** 2026-04-30
**Core Value:** Staff can confidently create and manage trip schedules quickly, with clear UI and safe bulk actions.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Template Day Authoring

- [ ] **TMPL-01**: Staff can create a template day for a selected program
- [ ] **TMPL-02**: Staff can add and edit template slots with departure time
- [ ] **TMPL-03**: Staff can set boat type, water route, and capacity per template slot
- [ ] **TMPL-04**: Staff can configure ticket setup and constraints per template slot
- [ ] **TMPL-05**: Staff can add internal notes per template slot

### Calendar Apply

- [ ] **APLY-01**: Staff can select multiple calendar dates and apply a template day in one action
- [ ] **APLY-02**: Staff can preview targeted dates and planned trip creations before confirming
- [ ] **APLY-03**: System avoids duplicate trip creation on target dates by default
- [ ] **APLY-04**: Staff receives deterministic apply outcomes grouped as created, skipped duplicate, and conflict

### Safety and Clarity UX

- [ ] **SAFE-01**: Apply flow requires explicit confirmation with clear scope language ("Apply to N dates")
- [ ] **SAFE-02**: UI shows conflict and risk warnings before commit
- [ ] **SAFE-03**: UI provides a post-apply result summary/receipt suitable for operator review
- [ ] **SAFE-04**: Bulk apply behavior is non-destructive by default (no silent replacement of existing trips)

### Backend Integrity

- [ ] **API-01**: Backend provides preview and commit endpoints for bulk template apply
- [ ] **API-02**: Bulk apply commit is idempotent for retry/offline replay safety
- [ ] **API-03**: Duplicate-prevention is enforced with database-level uniqueness plus server conflict policy
- [ ] **API-04**: Program-scoped authorization controls access to preview/commit operations

## v2 Requirements

Deferred to later milestones.

### Scheduling Enhancements

- **SCHD-01**: Weekday-pattern and date-range recurrence tooling for template application
- **SCHD-02**: Rich calendar overlays (holidays/exceptions) during scheduling
- **SCHD-03**: Advanced undo/rollback policies for bulk scheduling operations
- **SCHD-04**: AI-assisted schedule optimization recommendations

## Out of Scope

Explicitly excluded for this milestone.

| Feature | Reason |
|---------|--------|
| Public-facing scheduling and template controls | This milestone is staff/admin only |
| Payment and checkout expansion tied to scheduling UI | Unrelated to the template-day UX gap |
| Role matrix redesign | Existing staff model is sufficient for this scope |
| Full recurrence engine | Can be deferred after safe multi-date apply ships |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TMPL-01 | Phase 1 | Pending |
| TMPL-02 | Phase 1 | Pending |
| TMPL-03 | Phase 1 | Pending |
| TMPL-04 | Phase 1 | Pending |
| TMPL-05 | Phase 1 | Pending |
| APLY-01 | Phase 3 | Pending |
| APLY-02 | Phase 3 | Pending |
| APLY-03 | Phase 2 | Pending |
| APLY-04 | Phase 4 | Pending |
| SAFE-01 | Phase 3 | Pending |
| SAFE-02 | Phase 3 | Pending |
| SAFE-03 | Phase 4 | Pending |
| SAFE-04 | Phase 4 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 2 | Pending |
| API-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-04-30*
*Last updated: 2026-04-30 after roadmap creation*

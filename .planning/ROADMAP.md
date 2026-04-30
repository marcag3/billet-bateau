# ROADMAP: Billet Bateau

**Created:** 2026-04-30  
**Granularity:** standard  
**Total v1 requirements:** 17  
**Coverage:** 17/17 mapped

## Phases

- [ ] **Phase 1: Template Day Authoring UI** - Staff can create and maintain realistic template days with full slot details.
- [ ] **Phase 2: Apply Integrity and Access Control** - Bulk apply operations are idempotent, duplicate-safe, and authorization-gated.
- [ ] **Phase 3: Multi-Date Preview and Confirmation** - Staff can target many dates, preview exact impact, and confirm scoped changes safely.
- [ ] **Phase 4: Deterministic Outcomes and Operator Receipt** - Staff receive clear post-apply outcomes with non-destructive behavior by default.

## Phase Details

### Phase 1: Template Day Authoring UI
**Goal**: Staff can define and update reusable template days with complete operational slot details in the admin interface.
**Depends on**: Nothing (first phase)
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05
**Success Criteria** (what must be TRUE):
  1. Staff can create a template day for a selected program and see it persist in admin views.
  2. Staff can add and edit slots with departure time, and changes are reflected immediately in template details.
  3. Staff can set boat type, route, and capacity per slot and see those values shown before save/apply steps.
  4. Staff can configure ticket setup constraints per slot without leaving the template workflow.
  5. Staff can record and later review internal slot notes used for staff operations.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Apply Integrity and Access Control
**Goal**: Bulk template apply operations are reliable under retries/offline replay, prevent duplicate trip creation, and enforce program-scoped access.
**Depends on**: Phase 1
**Requirements**: API-01, API-02, API-03, API-04, APLY-03
**Success Criteria** (what must be TRUE):
  1. Staff can trigger preview and commit apply operations through stable backend endpoints.
  2. Repeating the same apply intent (retry/replay) does not create additional trips for the same date/slot identity.
  3. Duplicate trip attempts are skipped by default and existing trips remain intact.
  4. Staff without correct program authorization cannot preview or commit template applies.
**Plans**: TBD

### Phase 3: Multi-Date Preview and Confirmation
**Goal**: Staff can confidently select many dates, preview exactly what will happen, and explicitly confirm scoped changes before commit.
**Depends on**: Phase 2
**Requirements**: APLY-01, APLY-02, SAFE-01, SAFE-02
**Success Criteria** (what must be TRUE):
  1. Staff can select multiple target dates and apply a template in a single guided flow.
  2. Staff can review a preview of targeted dates and planned trip creations before any data is committed.
  3. Apply action requires explicit confirmation language that includes clear scope (for example, "Apply to N dates").
  4. Conflict/risk warnings are visible before commit so operators can stop or adjust safely.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Deterministic Outcomes and Operator Receipt
**Goal**: After bulk apply, staff can audit deterministic outcomes in clear result buckets, with non-destructive behavior as the default operating mode.
**Depends on**: Phase 3
**Requirements**: APLY-04, SAFE-03, SAFE-04
**Success Criteria** (what must be TRUE):
  1. Staff receives a post-apply receipt summarizing results grouped by created, skipped duplicate, and conflict outcomes.
  2. Staff can review apply results immediately in UI language suitable for operator handoff/review.
  3. Default bulk apply does not silently replace or delete existing trips.
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Template Day Authoring UI | 0/3 | Not started | - |
| 2. Apply Integrity and Access Control | 0/3 | Not started | - |
| 3. Multi-Date Preview and Confirmation | 0/3 | Not started | - |
| 4. Deterministic Outcomes and Operator Receipt | 0/2 | Not started | - |

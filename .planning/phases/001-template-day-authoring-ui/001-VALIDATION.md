---
phase: 1
slug: template-day-authoring-ui
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-30
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | phpunit (via `php artisan test`) |
| **Config file** | `phpunit.xml` |
| **Quick run command** | `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest` |
| **Full suite command** | `php artisan test --compact` |
| **Estimated runtime** | ~30–180 seconds (depends on DB container) |

---

## Sampling Rate

- **After every task commit:** Run `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest`
- **After every plan wave:** Run `php artisan test --compact`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| P1-01-T1 | 01 | 1 | TMPL-02..05 | — | validate JSON + max lengths | feature | `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest` | ✅ | ⬜ pending |
| P1-01-T2 | 01 | 1 | TMPL-02..05 | — | reject invalid payload | feature | `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest` | ✅ | ⬜ pending |
| P1-01-T3 | 01 | 1 | TMPL-02..05 | — | regression coverage | feature | `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest` | ✅ | ⬜ pending |
| P1-02-T1 | 02 | 2 | TMPL-01 | — | staff-only routes | lint | `pnpm -C resources/js lint` | ✅ | ⬜ pending |
| P1-02-T2 | 02 | 2 | TMPL-01 | — | list page wiring | lint | `pnpm -C resources/js lint` | ✅ | ⬜ pending |
| P1-02-T3 | 02 | 2 | TMPL-01 | — | create flow wiring | lint | `pnpm -C resources/js lint` | ✅ | ⬜ pending |
| P1-03-T1 | 03 | 3 | TMPL-02..05 | — | editor validation | lint | `pnpm -C resources/js lint` | ✅ | ⬜ pending |
| P1-03-T2 | 03 | 3 | TMPL-02..05 | — | i18n complete | lint | `pnpm -C resources/js lint` | ✅ | ⬜ pending |
| P1-04-T1 | 04 | 4 | TMPL-02 | — | canonical time format | feature | `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest` | ✅ | ⬜ pending |
| P1-04-T2 | 04 | 4 | TMPL-04..05 | — | reject invalid ticket_setup/notes | feature | `php artisan test --compact --filter=PowerSyncUploadTemplateDayTest` | ✅ | ⬜ pending |
| P1-04-T3 | 04 | 4 | TMPL-01..05 | — | consistent outbox UX | manual | — | ⬜ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing PHPUnit + feature test infrastructure covers this phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Authoring UI flow (list → create → edit → slot CRUD) | TMPL-01..05 | No frontend test harness specified in repo yet | Open app, select program, go to Edit context → Template days, create a template day, add/edit/delete slots; verify UI shows outbox error banner when upload fails |

---

## Validation Sign-Off

- [ ] All tasks have `<acceptance_criteria>` and a verification path (automated or manual)
- [ ] Sampling continuity: run the quick test command after each backend-affecting task
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending


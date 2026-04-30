# Feature Landscape

**Domain:** Staff-facing template-day calendar scheduling (booking/admin systems)  
**Researched:** 2026-04-30  
**Focus:** Clarity and safe changes when applying template days to real calendar dates

## Table Stakes

Features staff expects in a credible scheduling flow. Missing these makes the workflow feel risky or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Template creation and reuse (day/week patterns) | Core promise of "template-day" UX is speed via reuse | Medium | Matches common scheduling products that save reusable day/week patterns. |
| Multi-date apply with explicit target range | Staff plans in batches, not one date at a time | Medium | Apply flow should support selecting multiple dates in one action. |
| Conflict/duplicate handling options before apply | Silent duplicate creation is unacceptable in admin scheduling | High | Must show conflict policy choices (overwrite/skip/move to unassigned) before commit. |
| Pre-apply confirmation summary ("what will change") | Safety and confidence require previewing impact | High | Include counts: dates touched, trips created, conflicts skipped/modified. |
| Forward-only edit scope for recurring/template-derived changes | Standard calendar behavior preserves history | Medium | Support scoping like "this date only" vs "this and following" where series semantics apply. |
| Draft vs published schedule state | Staff need safe staging before final visibility/operations impact | Medium | Keep edits reversible in draft; publish is explicit commit point. |
| Revert/discard draft changes | Operators need a quick "undo plan" for accidental bulk edits | Medium | Restore last published state for safety during heavy planning sessions. |
| Inline warnings for known conflicts (overlap/time-off/rule issues) | Prevents accidental bad schedules at decision time | Medium | Warning-first model, with controlled override where appropriate. |

## Differentiators

Features that are not strictly required for v1, but materially improve trust and operator efficiency.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Impact diff view before apply (grouped by date and trip slot) | Makes bulk changes auditable and understandable | High | Show create/update/skip breakdown by date before confirming. |
| Safe-mode defaults ("avoid duplicates" preselected) + policy memory per user/team | Reduces risk for routine usage while keeping flexibility | Medium | Aligns with product goal: safety over raw speed. |
| Dry-run simulation for selected dates | Lets staff test template effects without writing data | High | Especially useful when templates include many slots or seasonal exceptions. |
| Post-apply operation report with quick rollback entrypoint | Improves recovery from mistakes and supportability | High | "Applied to 14 dates, 3 skipped, rollback available" style receipt. |
| Exception overlay (holidays/special events) during date selection | Reduces hidden conflicts while selecting targets | Medium | Prevents applying normal-day templates into known exception days. |
| Guided apply wizard with progressive disclosure | Improves clarity for infrequent admins | Medium | Steps: select dates -> resolve conflicts -> preview -> apply. |

## Anti-Features (For This Milestone)

Explicitly avoid these in this milestone to protect clarity and delivery speed.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Fully automatic conflict resolution with no review | Violates "safe changes" goal; high blast radius | Require explicit operator choice and pre-apply summary. |
| Hidden or implicit background bulk applies | Hard to trust/audit; poor recoverability | Keep apply actions explicit, confirmable, and logged. |
| Overloaded mega-screen with every scheduling tool at once | Hurts clarity, increases operator error rate | Use focused template-day flow and progressive steps. |
| AI/autofill scheduling optimization in this phase | Adds complexity unrelated to core template safety gap | Defer until baseline template workflow is reliable. |
| Public-facing template controls | Out of current staff-only milestone scope | Keep all template apply controls in admin/edit context only. |
| Fine-grained role matrix redesign | Not required by current product decisions | Continue authenticated staff model; revisit in later security milestone. |

## Feature Dependencies

```text
Template slot model complete
  -> Template editor UI
  -> Multi-date selector
  -> Pre-apply diff computation
  -> Apply command execution

Conflict detection engine
  -> Conflict policy chooser
  -> Pre-apply warning summary
  -> Safe defaults ("avoid duplicates")

Draft/publish state support
  -> Revert to published
  -> Publish-time validation checks

Apply operation logging
  -> Post-apply report
  -> Rollback entrypoint
  -> Audit/support traceability
```

## MVP Recommendation (This Milestone)

Prioritize:
1. Template creation/editing with full slot details (time, boat type, route, capacity, ticket setup, notes).
2. Multi-date apply with explicit conflict policy (default: avoid duplicates).
3. Pre-apply confirmation summary with clear change counts.
4. Draft + publish + revert safety loop for staff confidence.

Defer:
- Advanced dry-run and full rollback automation: valuable, but can follow once baseline apply is stable and audited.
- Exception overlays and calendar intelligence: high leverage but secondary to core safe-apply path.

## Confidence Notes

- **Table stakes confidence: HIGH** — corroborated by multiple official scheduling help docs and calendar recurrence behaviors.
- **Differentiators confidence: MEDIUM** — grounded in established UX safety principles and product direction, with fewer direct vendor docs for exact implementations.
- **Anti-features confidence: HIGH** — directly aligned to milestone scope and explicit project constraints.

## Sources

- [When I Work — Using Schedule Templates](https://help.wheniwork.com/articles/using-schedule-templates-computer) (official help center, updated 2025-09-17)
- [Google Calendar Help — Create recurring event](https://support.google.com/calendar/answer/37115?co=GENIE.Platform%3DDesktop&hl=en) (official help)
- [Google Calendar API — Recurring events](https://developers.google.com/calendar/api/guides/recurringevents) (official developer docs)
- [Restaurant365 — Publish or Unpublish Schedules](https://docs.restaurant365.com/doc/docs/schedule-calendar-publish-unpublish-and-alert-employees) (official docs)
- [Easyteam — Create and manage employee schedules](https://help.easyteam.io/en/article/create-and-manage-employee-schedules-183asi3) (official help, updated 2026-03-29)
- [Scheduling+ — Repeating shifts and conflict handling](https://schedulingplushelp.zendesk.com/hc/en-us/articles/39561175877901-Adding-and-Maintaining-Repeating-Shifts) (official help center)

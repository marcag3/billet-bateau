# Public Booking Flow — Completion Plan

> **Status:** **Complete (v1)** — Phases **0–3** shipped (verified 2026-05-27). Phases **4–5** deferred per open decisions unless product overrides.
>
> **Scope:** Unauthenticated catalog + 3-step checkout on `PublicProgramDetailPage` backed by `GET/POST /api/public/programs/{slug}/…`. Payment integration is **out of scope** unless explicitly added as Phase 5.
>
> **Baseline:** Core happy path is implemented (trip → tickets → contact → `bookings` + `booking_tickets`). See `README.md` “Completed” and `tests/Feature/PublicBookingApiTest.php`.

---

## Goal

Guests can discover an active program, complete a booking without staff intervention, receive accurate confirmation (UI + email), and staff see consistent data in admin/check-in — with clear rules for **who may book** and **when checkout is open**.

## Non-goals (this plan)

- Stripe / payment capture (README: “no payment” v1)
- PowerSync uplink for parent `bookings` (staff ops; separate roadmap)
- Voyage lifecycle, check-in manifest UI (downstream of booking)

---

## Current state summary

| Area | Status |
|------|--------|
| API `booking-options` + `store` | Done |
| Server validation (capacity, min/max, dependency ratio, custom answers) | Done — `CreatePublicBookingAction` |
| Frontend stepper + client validation | Done — `PublicProgramDetailPage`, `public-booking-validation.ts` |
| Trip filters (date, product) | Done |
| Program custom questions (textarea admin → checkout) | Done |
| Ticket types admin | Done — `AppTicketTypesPage` |
| Confirmation email | Done — `BookingConfirmationNotification` (uses `bookingTickets`, not `tickets`) |
| Success UI copy | Done — reference + ticket count + email line |
| `is_active` on public show/booking routes | Done — `resolveRouteBinding` uses `active()` |
| “Public booking open” product/program flag | **Deferred** — D1: `is_active` sufficient |
| Laravel policies for guest booking | Done — `BookingPolicy::createPublic` |
| Rich trip cards on checkout | Done — Phase 3 (banner, route name/duration; no map) |
| Per-passenger fields, waiver, country | **Not implemented** — single contact copied to all tickets |
| PWYC amount capture | **Not implemented** — label only |
| Formal policy matrix | **Partial** — membership checks on PowerSync upload only |

### Key files

| Concern | Location |
|---------|----------|
| Public page + stepper | `resources/js/pages/PublicProgramDetailPage.vue` |
| Step components | `resources/js/components/public-program/PublicProgramBooking*.vue` |
| Client validation | `resources/js/utilities/public-booking-validation.ts` |
| API controller | `app/Http/Controllers/Api/PublicBookingController.php` |
| Create booking | `app/Actions/CreatePublicBookingAction.php` |
| DTOs | `app/Data/Programs/PublicBooking*.php` |
| Routes | `routes/api.php` (`public` prefix) |
| Program route binding | `app/Models/Program.php` (`resolveRouteBinding`) |
| Tests | `tests/Feature/PublicBookingApiTest.php`, `tests/Feature/PublicProgramApiTest.php` |
| i18n | `resources/js/utilities/locales/en.ts`, `fr.ts` (`publicBooking.*`) |

---

## Phases overview

| Phase | Theme | Ship criteria |
|-------|--------|----------------|
| **0** | Truth in UX | Success screen matches reality |
| **1** | Bookability gates | Only intended programs accept bookings |
| **2** | Confirmation comms | Guest receives email; reference visible |
| **0–2** | Shipped | Verified; see progress log |
| **3** | Checkout polish | Trip selection matches API richness — **done** |
| **4** | Questions & passengers | Deferred (D3/D4 defaults) unless ops require |
| **5** | Payment & PWYC | Out of scope for this plan |

---

## Phase 0 — Success screen honesty

**Problem:** `publicBooking.checkEmailConfirmation` is shown but no mail is sent. `publicBooking.successBody` (reference + ticket count) exists but is unused.

### Task 0.1 — Update success card copy

**Files:**
- Modify: `resources/js/pages/PublicProgramDetailPage.vue`
- Modify: `resources/js/utilities/locales/en.ts`, `fr.ts`
- Modify: `resources/js/tests/pages/PublicProgramDetailPage.test.ts`

- [x] Replace `checkEmailConfirmation` with `successBody` interpolated with `createdBooking` (`id`, `total_tickets`).
- [x] Remove or reword email promise until Phase 2 ships.
- [x] Update FR/EN strings and unit test expectations.

**Acceptance:** After submit, user sees booking reference and ticket count; no “check your email” unless email was sent.

---

## Phase 1 — Bookability & authorization

**Problem:** `GET /api/public/programs` uses `Program::active()`, but `resolveRouteBinding` only filters `end_date >= today`. Inactive programs remain showable/bookable by slug (`PublicProgramApiTest::test_show_resolves_by_slug_and_does_not_require_is_active`). No explicit “booking open” switch.

### Task 1.1 — Align route binding with catalog rules

**Files:**
- Modify: `app/Models/Program.php` (`resolveRouteBinding`)
- Modify: `tests/Feature/PublicProgramApiTest.php`
- Modify: `tests/Feature/PublicBookingApiTest.php`

- [x] Require `is_active = true` in `resolveRouteBinding` (or call `active()` scope).
- [x] Change `test_show_resolves_by_slug_and_does_not_require_is_active` → expect 404 for inactive slug.
- [x] Add booking-options + store tests: inactive / past `end_date` → 404.

**Acceptance:** Direct slug access cannot book archived or inactive programs.

### Task 1.2 — Optional: `public_booking_enabled` (or reuse `is_active` only)

**Skipped (2026-05-27):** D1 default — `is_active` is sufficient; no column or admin toggle added.

**Decision needed:** Is `is_active` sufficient, or do staff need “visible on catalog but booking closed”?

If a separate flag is required:

**Files:**
- Modify: `database/migrations/2026_04_23_120002_create_programs_table.php` (edit in place per project rules)
- Modify: `app/Models/Program.php`, program DTOs, PowerSync schema/sync-config, admin program edit/create pages
- Modify: `PublicBookingController` — reject options/store when disabled
- Tests: feature tests for disabled booking

- [ ] Add column (e.g. `public_booking_enabled` boolean, default `true`).
- [ ] Admin toggle on program edit.
- [ ] Public API returns 404 or 403 on booking endpoints when false.

**Acceptance:** Staff can close checkout without hiding the program page (if product decision confirms).

### Task 1.3 — Booking policies for guest `store`

**Files:**
- Create: `app/Policies/BookingPolicy.php` (or `PublicBookingPolicy`)
- Modify: `app/Http/Controllers/Api/PublicBookingController.php`
- Register: `AppServiceProvider` / `AuthServiceProvider` if needed
- Tests: policy + controller authorization tests

- [x] `store`: allow guest when program is active, in season, and booking enabled.
- [x] Document that `POST /api/powersync/upload` remains staff-only (unchanged).

**Acceptance:** Authorization is explicit in policy; controller calls `authorize()` or equivalent.

---

## Phase 2 — Confirmation communications

**Problem:** No notification after successful `store`.

### Task 2.1 — Booking confirmation notification

**Files:**
- Create: `app/Notifications/BookingConfirmationNotification.php` (or Mailable + Notification)
- Modify: `app/Actions/CreatePublicBookingAction.php` or `PublicBookingController::store` (send after commit)
- Modify: `config/mail.php` / `.env.example` if new vars
- Tests: `Notification::fake()` in `PublicBookingApiTest` or dedicated test

- [x] Queue or sync-send to `contact_email` with program name, trip departure, ticket summary, booking id.
- [x] French-first copy (match app i18n priority); EN optional same pass.
- [x] Do not send on validation failure / rolled-back transaction.
- [x] **Fix (verification):** Eager-load `bookingTickets.ticketType` (not `tickets`). Add `test_booking_confirmation_notification_mail_renders_with_ticket_summary` so `toMail()` runs in CI (`Notification::fake()` alone does not).

**Acceptance:** Successful `POST …/bookings` triggers exactly one confirmation per booking; mail renders without 500.

### Task 2.2 — Restore email line on success UI

**Files:**
- Modify: `PublicProgramDetailPage.vue`, locales, tests

- [x] After Task 2.1, add secondary line: “We sent a confirmation to {email}.”
- [x] Keep `successBody` as primary message.

**Acceptance:** Copy matches actual notification behavior.

---

## Phase 3 — Checkout UX polish (DONE)

**Problem:** `PublicBookingTripOptionData` exposes product/boat banners and `water_route_trace_geojson`; trip step rendered a virtualized table only.

**Shipped:** `PublicProgramBookingTripListRow.vue` + `public-booking-trip-display.ts`; virtual scroll table with avatar, departure, trip column (product + route text), availability.

### Task 3.1 — Trip row / card enrichment

**Files:**
- Modify: `PublicProgramBookingTripStep.vue`
- Extract: `PublicProgramBookingTripListRow.vue`
- Modify: `resources/js/tests/components/PublicProgramBookingTripStep.test.ts`

- [x] Show product name, departure, availability, optional thumbnail (`pickTripBannerUrl`).
- [x] Show water route name + duration when present.
- [x] Keep virtual scroll table; row slots with `q-img` avatar; minimal scoped CSS.

**Acceptance:** Guest can distinguish trips without opening filters only.

### Task 3.2 — Optional route preview

**Default (D5):** Skip interactive map. Show route **name + duration** text only in Task 3.1.

**Files:**
- New small component using trace GeoJSON (read-only map or static image — avoid heavy deps unless already in project)

- [x] *(Skipped per D5)* Interactive map / trace preview — not implemented for v1.
- [x] Graceful empty state when trace null (text-only row; no map dependency).

**Acceptance:** No regression when trace missing; no map editor on public side.

---

## Phase 4 — Deeper checkout data (DEFERRED for v1)

**Defaults:** D3 = single contact OK; D4 = waiver at check-in only. Do not implement 4.2–4.3 unless user explicitly requests before closing the plan.

### Task 4.1 — Richer custom questions (admin + API + UI)

**README checkout todo:** program/trip scope, stricter validation.

- [ ] *(Deferred)* Data model: question objects (`id`, `label`, `required`, `scope`, `type`?) vs plain string array.
- [ ] Admin: structured editor on `AppProgramEditPage` (replace newline textarea).
- [ ] API: `booking_questions` shape versioned in `PublicBookingOptionsData`.
- [ ] Frontend: per-question input types + validation; server mirrors rules in `CreatePublicBookingAction`.

**Acceptance:** At least one non-text question type OR documented deferral.

### Task 4.2 — Per-passenger capture

**Problem:** All `booking_tickets` get the same `name`/`email`; `country` empty; `waiver_confirmation_id` null.

- [ ] When total tickets > 1, optional step or inline expansion for passenger name (and email if required).
- [ ] Extend `PublicBookingStoreData` + validation + `CreatePublicBookingAction` loop.
- [ ] Tests for 2+ tickets with distinct names.

**Acceptance:** Manifest-ready names without staff edit for typical family bookings.

### Task 4.3 — Waiver at booking time

- [ ] If business requires: collect waiver reference or checkbox attestation; persist `waiver_confirmation_id` or structured custom field.
- [ ] Coordinate with check-in context later.

**Acceptance:** Defined with ops — skip if waiver only at dock.

---

## Phase 5 — Payment & PWYC (OUT OF SCOPE)

Not required to close this plan or “free checkout” v1. Leave unchecked; track in README **Later** if needed.

- [ ] PWYC: amount input on tickets step; store amount on booking or line item.
- [ ] Payment provider integration; webhook confirms before marking booking confirmed.
- [ ] Do not show “Pay what you can” without capture if payment is required.

---

## Testing checklist (run per phase)

| Phase | Commands |
|-------|----------|
| 0–2 | `php artisan test --compact tests/Feature/PublicBookingApiTest.php tests/Feature/PublicProgramApiTest.php tests/Feature/BookingPolicyTest.php` |
| 0 | `npm test -- PublicProgramDetailPage` (or project’s vitest command for `resources/js/tests/pages/PublicProgramDetailPage.test.ts`) |
| 1–2 | Add cases for inactive program, booking disabled, notification sent |
| 3 | `npm test -- --run resources/js/tests/components/PublicProgramBookingTripStep.test.ts` |

---

## Suggested implementation order

1. **Phase 0** — Quick win, removes false promise.
2. **Phase 1** — Security/product correctness before marketing URLs.
3. **Phase 2** — Guest trust + support load reduction.
4. **Phase 3** — UX if launch marketing depends on trip clarity.
5. **Phase 4** — Only if ops require before go-live.
6. **Phase 5** — New initiative.

---

## README sync

After each phase ships, update `README.md` todo sections:

- Move completed bullets under **Completed**.
- Remove or narrow **Public booking** / **Checkout** items that this plan addresses.
- Keep **Later** for electronic ticket PDF until implemented.

---

## Open decisions (resolve before coding 1.2 / 4.x)

| # | Question | Default if undecided |
|---|----------|----------------------|
| D1 | Is `is_active` enough to gate booking? | Yes — skip `public_booking_enabled` |
| D2 | Confirmation email language | French only first |
| D3 | Per-passenger required for v1? | No — single contact OK |
| D4 | Waiver at booking vs check-in? | Check-in only |
| D5 | Map on trip step for v1? | No — banners + text only |

---

## Progress log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-05-27 | — | Plan created from codebase audit |
| 2026-05-27 | 0–2 | Success honesty, `is_active` route binding, `BookingPolicy`, confirmation email + UI |
| 2026-05-27 | 3–5 | Initially deferred |
| 2026-05-27 | 2 | **Verification:** `BookingConfirmationNotification` used wrong relation `tickets` → 500 on real POST; fixed to `bookingTickets` + mail render test |
| 2026-05-27 | 3 | Trip step: `PublicProgramBookingTripListRow`, banners, route name/duration; Vitest + README; plan **Complete (v1)** |

---

## Verification (2026-05-27)

Phases 0–3 meet acceptance criteria. PHPUnit public booking suite + `PublicProgramBookingTripStep` Vitest pass.

**Known risks (not blocking v1):**

- Mail failure after DB commit may still return 500 to client while booking exists.
- `Notification::fake()` does not exercise `toMail()` — keep `test_booking_confirmation_notification_mail_renders_with_ticket_summary`.

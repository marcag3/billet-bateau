Local-first pwa based on tanstack-db + powersync. Using quasar.dev components and laravel backend.
Optimistic update.

## Program admin contexts (edit, control, checkin)

After a program is selected, staff work is split into **three contexts**. Each context is a separate route subtree under `/programs/:programId/` with its own **context layout** component in `resources/js/layouts/` (`AppProgramEditContextLayout.vue`, `AppProgramControlContextLayout.vue`, `AppProgramCheckinContextLayout.vue`). Those wrappers own **defaults** for shell behavior in that area—navigation grouping, header mode, program-switch rules—so `AppLayout.vue` stays a thin shell and child routes inherit context-level intent instead of repeating the same route meta everywhere.

| Context     | URL segment                         | Purpose                                                                                                |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Edit**    | `edit-context/`                     | Program configuration and catalog: boats, boat types, water routes, trips, reports, settings, and program metadata at `edit-context/edit`. |
| **Control** | `control-context/control`           | Program **control panel**: operations-facing entry for that program.                                   |
| **Checkin** | `checkin-context/checkin`           | **Check-in manager** for the program (bookings / manifest workflows scoped to the program).            |

Program shell policy for the app chrome (e.g. in-place program switching) is set by the active context layout via the `appLayout` Pinia store while that layout is mounted, not from route meta. Add new pages under the context whose UX belongs with that group; use per-page overrides only when a single screen genuinely differs from its context defaults.

# Implementation steps:

## Todo list

Checkboxes mirror the working roadmap; high-level domain notes stay in sections below (_Ticket types & ratio_, _On-water operations_, etc.). **Backend** means Laravel migrations/models/API; **admin UI** is the authenticated Quasar bundle; **public** is the unauthenticated catalog SPA (`routes/web.php` fallback).

### Completed

- [x] Design architecture for separating responsibility cleanly in the frontend (program edit / control / check-in contexts + layouts)
- [x] Install PowerSync (Docker service + Laravel credentials + TanStack sync bootstrap)
- [x] Programs (base: name, description, theme, address, media; admin create; synced); **`slug`** on `programs` for public URLs
- [x] Boat types & boats: CRUD in admin UI + PowerSync downlink/uplink + tests
- [x] Water routes (_Parcours_): CRUD + sync; trace capture via **GeoJSON textarea** in admin (not an interactive map editor yet)
- [x] Trips (_Sorties_): migrations + PowerSync + admin list / create / edit pages (`boat_type_id`, `water_route_id`, `scheduled_departure_at`, `capacity`, optional `template_day_slot_id`)
- [x] Template days / slots / dates: migrations, PowerSync sync + uplink, TanStack collections + models + `PowerSyncUploadTemplateDayTest` — **no** dedicated scheduling/calendar UI yet
- [x] Ticket types: per-program fields (title, `price_cents`, PWYC, min/max, `trip_inventory_caps` JSON) + PowerSync downlink/uplink (`PUT` / `PATCH` / `DELETE` on `POST /api/powersync/upload`; idempotent no-op when the row is missing; delete returns **422** if `booking_tickets` still reference the type) + `PowerSyncUploadTicketTypeBookingTicketTest` — **no** admin screens wired (models/sync only)
- [x] Booking **line items**: `booking_tickets` (name, email, country, `custom_fields` JSON, optional `waiver_confirmation_id`) + the same uplink path + tests — requires a pre-existing `bookings` row today (no uplink for parent **bookings** yet; **`bookings` not in local PowerSync schema**)
- [x] Public **read-only** catalog: `GET /api/public/programs`, `GET /api/public/programs/{slug}`, public home + program detail pages (`PublicHomePage`, `PublicProgramDetailPage`)
- [x] PHPUnit: PostGIS geometry + relations (`OnWaterDataModelTest`); PowerSync upload coverage (programs, boats, trips/water routes, template stack, ticket types / booking tickets); `PublicProgramApiTest`

### Public booking

- [x] Shareable program link / slug — **view catalog without login** (API + public SPA)
- [ ] Guest booking flow: pick trip / date / quantities; **v1: no payment** — reserve/hold or confirm-only (UI + backend writes for anonymous users)
- [ ] Laravel policies for **guest writes** to bookings when the product opens public checkout (`POST /api/powersync/upload` remains **staff-authenticated** today)

### Checkout

- [x] Baseline fields on **`booking_tickets`**: name, email, country, optional **`waiver_confirmation_id`**, and **`custom_fields`** JSON (schema + PowerSync validation)
- [ ] Product flow that **creates `bookings`** (parent rows) from checkout — API or PowerSync `bookings` type + local sync table for offline staff workflows
- [ ] Admin-defined questions per trip/program beyond generic JSON — authoring UI and validation rules

### Ticket types

- [x] Backend + sync: title, price, PWYC, min/max per purchase
- [x] Store **per-trip caps** in **`trip_inventory_caps`** (JSON map of trip id → cap); enforcement logic still open
- [ ] Admin UI (Quasar) to manage ticket types for the selected program
- [ ] Server-side inventory enforcement against caps per trip

### Companion / ratio rules

- [ ] Data model: anchor + dependent ticket types; `numerator` / `denominator` (per program or template)
- [ ] Admin UI: pick two types + ratio (no hard-coded adult/child labels)
- [ ] Cart/checkout validation and **server** re-validation (start with same-order + same-date if simpler)

### Trips and calendar

- [x] Trips as bookable rows with **`scheduled_departure_at`**, capacity, `program_id`, **`boat_type_id`**, **`water_route_id`**, optional link to **`template_day_slot_id`**
- [ ] **Template calendar UX**: assign template days to dates and visualize trips — data layer exists without calendar screens
- [ ] Manual “day planner” beyond today’s trip list CRUD (if the product needs it)

### Backend — on-water data model

- [x] PostGIS + Magellan in Docker/CI; `water_routes`: `name`, `trace` (LineString), `duration_minutes` — reusable rows
- [x] `boats`; **`trips`** with planned route + boat type
- [x] **`voyages`** table (+ **`user_id`** on row today), **`voyage_boat`**, **`guides`**, **`voyage_guide`**, **`check_ins`**, **`passengers`** — migrations, factories, Eloquent relations (`OnWaterDataModelTest` covers core geometry/trip/voyage/passenger shapes)
- [ ] Voyages **runtime**: HTTP actions (`startVoyage`, `markArrived`), ETA helpers, and aligning **`passengers`** with ticket types for manifests

### API and state

- [x] Thin policies / gates in practice: public catalog **without** auth; PowerSync upload **requires** Sanctum user; upload actions assert **program membership** (`userCanManage`) on mutated rows (including `ticket_types` and `booking_tickets`)
- [ ] Formal policy coverage surface matching every route/resource if you want everything routed through Laravel policies consistently
- [ ] `startVoyage`: idempotent; `underway`; persist boats + guides; ETA from **`trips.scheduled_departure_at`** or ad-hoc **`voyages.scheduled_departure_at`** + **`water_routes.duration_minutes`** on **`voyages.water_route_id`**
- [ ] `markArrived` / complete; status transitions (`draft` \| `ready` \| `underway` \| `completed` \| `cancelled` — tune names)
- [ ] Audit: who started / closed the voyage

### PowerSync and admin client

- [x] **Synced today** (program scope in `docker/powersync/sync-config.yaml`): programs (user scope list), `boat_types`, `media`, `boat_program`, `boats`, `trips`, `water_routes`, `template_days` / `template_day_slots` / `template_day_dates`, `ticket_types`, `booking_tickets` (joined through `bookings`)
- [x] **Uplink** for those tables via `POST /api/powersync/upload` (`PowerSyncUploadRouter`)
- [ ] Sync / uplink for **`bookings`** headers, **`voyages`**, **`guides`** (if edited offline), **`check_ins`**, **`passengers`**, operational pivots — required for field ops + check-in offline
- [ ] Conflict rules (single-writer per voyage, queue retries, …) documented and enforced beyond best-effort FIFO batches
- [ ] TanStack DB: optimistic voyage lifecycle + reconcile on reconnect; document offline-allowed vs forbidden actions

### Admin UI (Quasar)

- [x] Edit context: boats, boat types, water routes (textarea trace), trips CRUD, program edit, settings placeholder, reports placeholder
- [ ] **Parcours** map editor: draw LineString on a map (optional upgrade from GeoJSON textarea)
- [ ] Control context: ops board (today: **placeholder** `AppProgramControlPanelPage`)
- [ ] Start **départ** modal: multi boats, multi guides, notes
- [ ] Check-in context: manifest workflows (today: **placeholder** `AppProgramCheckinManagerPage`)
- [ ] Ticket types screens (sync-ready models exist without pages)

### Fleet and sequencing notes

- [x] Boat types / hulls CRUD + sync
- [ ] Guides: tables exist; **no** admin UI or PowerSync sync yet
- [ ] Optional: **Voyage** with `trip_id` null for field tests; end-to-end with bookings + check-in

### Testing

- [x] PostGIS in CI; upload/trip/water route/template/ticket + booking ticket feature tests (`PowerSyncUploadTicketTypeBookingTicketTest` and sibling `PowerSyncUpload*` tests)
- [ ] PHPUnit: voyage **lifecycle** HTTP API, ETA = departure + **voyage** route duration, policy matrix if expanded
- [ ] Feature tests: `startVoyage` with N boats and M guides

### Cross-cutting

- [x] Partial French strings for **Sortie** / **Parcours** (trips & water routes lists) in `resources/js/utilities/i18n.ts`
- [ ] French-first pass for **Départ** / **Embarcation** / control & check-in placeholders and remaining screens

### Later

- [ ] Weekly schedule: start/end date; template days or individual trips
- [ ] Overrides: e.g. holidays with template days
- [ ] Extras: electronic ticket, thank-you email, advanced settings

## Naming notes

- **Database:** all **table** and **column** names are **English** (`snake_case`). French product words (_Sortie_, _Parcours_, _Départ_, …) appear in **UI and i18n only**, never as SQL identifiers.
- Use **Program** as the main container term (instead of campaign).
- A Program can represent a season or a special event.
- Keep **Trip** as the bookable unit under a Program.
- Program names are user-defined and should not be constrained by a code-level naming pattern.
- Typical user naming combines a base/origin context with a season/date context.
- **WaterRoute** = geographic path (model / `water_routes` table; aligns with _route_ in **GTFS**, but a distinct name avoids clashing with Laravel’s `Route` and facades). Rows are **reusable** across trips; **`scheduled_departure_at`** lives on **`trips`** (and on **`voyages`** only when `trip_id` is null). Every **`voyages`** row has a required **`water_route_id`** (actual run); it may differ from **`trips.water_route_id`** (planned).
- **Voyage** = on-water execution; **Trip** = what you book; hull assignment happens **at voyage start**, not at booking.
- **Manifest** table **`passengers`** + model **`Passenger`**: one **row per person** on the **`voyages`** row.
- **French (primary) product terminology** (below) is the **locked** mapping from code to user-facing copy.

## French (primary) product terminology

UI, marketing, and support copy are **French-first**. **Models, PHP, SQL tables, and SQL columns** use **English** identifiers only. **i18n keys and user-visible strings** use French (second column is the usual Fr label).

| Code (model) | Typical Fr (i18n)        |
| ------------ | ------------------------ |
| `Boat`       | **Embarcation**          |
| `BoatType`   | **Type d'embarcation**   |
| `WaterRoute` | **Parcours**             |
| `Voyage`     | **Départ**               |
| `Trip`       | **Sortie**               |
| `Passenger`  | _(French label in i18n)_ |

_Examples:_ "Démarrer le départ", "Sorties du jour", "Nouveau parcours", "Sélectionner l'embarcation".

---

## Ticket types & ratio (boat trips)

“at least one adult with a child” is a **1:1 companion** rule. For rabaska / boat trips you often need a **configurable ratio**.

**Suggested rule model (per program or per template):**

- **Anchor** ticket type (e.g. adult) and **dependent** ticket type (e.g. child).
- Store two positive integers `numerator` and `denominator` meaning:  
  **`anchor_qty × denominator ≥ dependent_qty × numerator`**

Examples:

| Meaning                                    | `numerator` / `denominator` |
| ------------------------------------------ | --------------------------- |
| At least **1 adult per 1 child** (pairing) | 1 / 1                       |
| At least **1 adult per 2 children**        | 1 / 2                       |
| At least **2 adults per 3 children**       | 2 / 3                       |

**Checkout validation:** for each line item (or for the whole cart for that date), if `child = dependent_qty` and `adult = anchor_qty`, reject unless the inequality holds. Re-validate on the server.

Optional UX: “Require companion tickets in the same order only” (stricter) vs “ratio across the booking” (e.g. family of 4 buying 2+2) — start with same-order, same-date if simpler.

This keeps the admin UI to: pick two types + set ratio, without hard-coding “adult/child” labels.

---

# On-water operations (WaterRoute, Trip, Voyage, ops board)

> **UI (Fr):** see **French (primary) product terminology** — _Parcours_ · _Sortie_ · _Départ_ · _Embarcation_ / _Type d'embarcation_. **`Passenger`** / **`passengers`** stay English in SQL; French strings live in i18n.

> **Naming:** the geographic entity matches _route_ in **GTFS** semantically, but the codebase uses **`WaterRoute`** and table **`water_routes`** (and `water_route_id` FKs) to avoid clashing with Laravel’s `Route` and routing.

> **Domain terms** (code)
>
> - **WaterRoute** — `water_routes`: reusable geometry; columns include `name`, `trace` (PostGIS + [Magellan](https://github.com/MatanYadaev/laravel-magellan) `LineString`), **`duration_minutes`** (no departure columns on this table). Authoring: map in admin. **UI:** _Parcours_.
> - **Trip** — `trips`: `program_id`, `boat_type_id`, planned `water_route_id`, **`scheduled_departure_at`**, capacity, etc. **UI:** _Sortie_.
> - **Voyage** — `voyages`: optional `trip_id`; required `water_route_id` (actual path; may differ from `trips.water_route_id`); `started_at`, `arrived_at`, `status`; optional `scheduled_departure_at` when `trip_id` is null. Boats via `voyage_boat`; guides via `voyage_guide`. **UI:** _Départ_.

## Locked product decisions (v1)

- **Staff / admin access:** v1 has **no user roles** (no super-admin vs guide vs read-only, etc.). **Any** authenticated back-office user may perform **all** admin operations. Policies and tests should only distinguish **guest vs authenticated** staff, not role tiers. **`POST /api/powersync/upload` follows the same rule** (no owner-only mutation gates for staff-managed synced rows such as programs, boat types, boats, addresses).
- **Voyage ↔ boats:** multiple hulls per voyage is **common** — `voyage_boat` (or similar pivot), not a single `boat_id`.
- **Voyage ↔ trip:** `trip_id` nullable; a voyage is linked to zero or one bookable trip.
- **Voyage ↔ water route:** **`water_route_id` is required** on every voyage — records the **actual** path/duration for that run; staff may pick a route different from the trip’s planned `water_route_id`.
- **Check-in:** **one check-in per booking (family = one booking)** — attaches the booking to a **voyage**. **Manifest** is table **`passengers`**: **one row per person** on the boat (everyone counted that way, including walk-ons and corrections vs sold tickets).
- **Payment:** **out of scope for v1** (simplifies booking; voyages and ops are still the core).
- **Start:** only **human** “start voyage” — no automatic start from schedule.
- **ETA:** use **`trips.scheduled_departure_at`** when `trip_id` is set, else **`voyages.scheduled_departure_at`**; add **`water_routes.duration_minutes`** for **`voyages.water_route_id`** (not necessarily the trip’s planned `water_route_id`; no live GPS in v1).
- **Admin UI:** **Quasar** — **public** bundle and **admin** bundle; the **admin bundle must work offline** (PowerSync: sync is **crucial** for operations data, not nice-to-have).

## Data model (backend) — step by step

1. **PostGIS + Magellan** in Docker/CI + PHP: enable `geometry` columns, migrations for **`water_routes`**: `name`, `trace` (`LineString`), **`duration_minutes`** (unsigned int or as you prefer) — **no** departure columns; rows are **reused** across **`trips`**.
2. **`boat_types`** — as today for trip catalog; **trips** reference `boat_type_id`, **`water_route_id`**, **`scheduled_departure_at`** (and capacity / calendar fields as you build the bookable model).
3. **`boats`** — as implemented: `boat_type_id`, optional `user_id` (audit/metadata only), `name`, optional `capacity`, `notes`, etc. Shared among staff, not user-isolated.
4. **`voyages`** — nullable `trip_id`, **`water_route_id` NOT NULL** (actual path for this row; may differ from `trips.water_route_id`), `started_at`, `arrived_at`, `status` (`draft` \| `ready` \| `underway` \| `completed` \| `cancelled` — tune names), optional `eta_cached_at`. Optional **`scheduled_departure_at`** only when **`trip_id`** is null; when **`trip_id`** is non-null, use **`trips.scheduled_departure_at`** for departure. **No** `boat_id` — use step 5.
5. **`voyage_boat`** — `voyage_id`, `boat_id` (and optional sort/`is_lead` if needed). Created/updated when staff **starts** the voyage (or edit before underway).
6. **`guides`** — e.g. **`display_name`**, **`email`**, **`phone`** (nullable as needed), nullable **`user_id`** (staff link).
7. **`voyage_guide`** (or order column on a pivot) — which guides for this voyage, set at start via **multi-select**.
8. **Check-in / manifest** — `check_ins`: one row per **`bookings`**, `voyage_id`, timestamps, optional `notes` / state. **`passengers`**: one row per person (`voyage_id`, e.g. **`display_name`**, optional **`booking_id`**, optional **`check_in_id`**, optional **`ticket_type_id`**, **`notes`**).
9. **Pax on board** — count / aggregate **`passengers`** for the voyage (by ticket type when available); keep consistent with **ticket types** (ratio rules) when booking exists.

## API & state machine

10. **Policies** — v1: any authenticated staff user may start/complete voyages and manage programs; use policies to reject **unauthenticated** access and for validation rules, not for staff role matrices.
11. **Transitions** — e.g. `startVoyage`: idempotent, sets `started_at`, status `underway`, persists boats + guides; recompute ETA from **`trips.scheduled_departure_at`** or **`voyages.scheduled_departure_at`**, plus **`water_routes.duration_minutes`** for **`voyages.water_route_id`** (v1: not `started_at`). `markArrived` → set `arrived_at`, `completed`.
12. **Audit** — who started / who closed the voyage, for support.

## PowerSync & offline (v1 = first-class)

13. **Tables to sync to admin clients** (minimum): **`water_routes`** (+ GeoJSON for map when online), `boats`, `boat_types`, **`trips`**, `voyages`, `voyage_boat`, `guides`, `voyage_guide`, `check_ins`, **`passengers`**, and anything the **bookings domain** needs for check-in. Define **uplink** (writes from device) and **conflict** rules (e.g. start voyage: single-writer per voyage, queue retries; or CRDT for counters — keep v1 **simple and explicit**).
14. **TanStack DB** in admin: optimistic start/arrive; reconcile when sync reconnects. Document which actions are **allowed offline** (e.g. start voyage offline → queue until server confirms) vs **forbidden** if you need server inventory checks.
15. **Map draw** for **`water_routes`** may require **online** authoring in v1, while **read** of trace works offline on the board after sync.

## Admin UI (Quasar, admin bundle)

16. **Water route editor** — draw `LineString` on map, set **`duration_minutes`**, **`name`**; save to API, syncs down.
17. **Ops board** — `voyages` with `status` in (ready/boarding, underway): trip/program label, `water_routes.name` for **`voyages.water_route_id`**, departure from **`trips.scheduled_departure_at`** or ad-hoc **`voyages.scheduled_departure_at`**, ETA + **`duration_minutes`**, headcount from **`passengers`**, boat and guide names, **Start voyage** / **Mark arrived**.
18. **Start voyage** modal — **multi-select boats** (filtered by trip’s `boat_type` or all of type), **multi-select guides**, optional notes; no payment step in v1.
19. **Check-in** — associating bookings to a **voyage** (`check_ins`); add/edit **`passengers`** (one row per person, including walk-ons); works **offline** per sync design.

## Testing

20. **PHPUnit** — voyage lifecycle, policy, **ETA = `scheduled_departure_at` + `duration_minutes`** (trip vs ad-hoc per rules above; **`voyages.water_route_id`** always set); PostGIS in CI. **Feature tests** for `startVoyage` with N boats and M guides.

## Order relative to the priority list above

- **`trips`** must expose **`boat_type_id`**, **`water_route_id`**, **`scheduled_departure_at`** before **`voyages.trip_id`** links are meaningful; every **`voyages`** row still needs **`water_route_id`** (UI may default to `trips.water_route_id`; ops may change). **`trip_id`** null: supply **`scheduled_departure_at`** + **`water_route_id`** on **`voyages`** for ETA.
- **Check-in** model depends on **bookings** existing (even without payment) — at least a booking + line items; **pax on board** comes from **`passengers`** rows.
- **Ratio rules** and displayed PAX should share the same notion of “adult/child” (or ticket-type buckets), aligned **per `passengers` row** when types exist.
- **Water routes** (PostGIS) and **Voyage** CRUD can proceed in parallel with a minimal booking stub, then connect end-to-end.

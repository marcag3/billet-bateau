Local-first pwa based on tanstack-db + powersync. Using quasar.dev components and laravel backend.
Optimistic update.

# Implementation steps:

## Priority:

[x] Design architecture for separating responsability cleanly in the frontend
[x] Install powersync
[x] Programs (base: name, description, theme, address, media; admin create; synced)
[] Public program link + booking flow (no account required; **v1: no payment** — reserve/hold or confirm only)
[] Booking questions at checkout: collect name, email, country, plus admin-defined personalized questions per trip/program
[] Ticket types per program (Zeffy-like: title, price, PWYC, min/max per purchase, inventory per **trip**)
[] **Companion / ratio rules** between ticket types (see below)
[] **Trips** as bookable units (date, capacity, link to a **template** or ad-hoc description)
[] Template day with defined trips (reusable “what runs on a typical day”)
[] Assign template days to calendar days
[] Manually add trips to calendar day
[] On-water: **WaterRoute** / *Parcours* (PostGIS + Magellan, map draw), **Voyage** / *Départ*, check-in, ops board (see below)
[] On-water: **fleet** (boat hulls by type), guides (optional `user_id`), **offline** admin bundle + PowerSync

## Later:

[] User can create weekly schedule. Assign a start and end date. Assign template days or individual trips.
[] User can override weekly schedule with template days (e.g. holidays)
[] Extras: electronic ticket, thank-you email, advanced settings (Zeffy parity)

## Naming notes

- Use **Program** as the main container term (instead of campaign).
- A Program can represent a season or a special event.
- Keep **Trip** as the bookable unit under a Program.
- Program names are user-defined and should not be constrained by a code-level naming pattern.
- Typical user naming combines a base/origin context with a season/date context.
- **WaterRoute** = geographic path (model / `water_routes` table; aligns with *route* in **GTFS**, but a distinct name avoids clashing with Laravel’s `Route` and facades).
- **Voyage** = on-water execution; **Trip** = what you book; hull assignment happens **at voyage start**, not at booking.
- **French (primary) product terminology** (below) is the **locked** mapping from code to user-facing copy.

## French (primary) product terminology

UI, marketing, and support copy are **French-first**. Models/tables/PHP stay in English; **i18n keys and all user-visible strings** use the French column.

| Code (model)      | French (UI)            |
| ----------------- | ---------------------- |
| `Boat`            | **Embarcation**        |
| `BoatType`        | **Type d'embarcation** |
| `WaterRoute`      | **Parcours**           |
| `Voyage`          | **Départ**             |
| `Trip`            | **Sortie**             |

*Examples:* "Démarrer le départ", "Sorties du jour", "Nouveau parcours", "Sélectionner l'embarcation".

---

## Ticket types & ratio (boat trips)

Zeffy-style “at least one adult with a child” is a **1:1 companion** rule. For rabaska / boat trips you often need a **configurable ratio**.

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

> **UI (Fr):** see **French (primary) product terminology** — *Parcours* · *Sortie* · *Départ* · *Embarcation* / *Type d'embarcation*.

> **Naming:** the geographic entity matches *route* in **GTFS** semantically, but the codebase uses **`WaterRoute`** and table **`water_routes`** (and `water_route_id` FKs) to avoid clashing with Laravel’s `Route` and routing.

> **Domain terms** (code)  
> - **WaterRoute** — named path: **trace** (PostGIS + [Magellan](https://github.com/MatanYadaev/laravel-magellan) `LineString`), **duration** (drives ETA with departure time). Authoring: **map drawn** in admin. **UI:** *Parcours*.  
> - **Trip** (bookable unit) — belongs to a program; has **boat type** (what customers book against) and is tied to a **water route** (and schedule/capacity). **No specific hull** at booking time. **UI:** *Sortie*.  
> - **Voyage** — one run on the water. **Optional** `trip_id` (ad-hoc without a *sortie* is possible). **Manual start only** (no auto-start). **One or many** `Boat` records (embarcations); chosen **at départ start** (multi-select). Same moment for **guide(s)**. **UI:** *Départ* (not *voyage* in French, to avoid ambiguity).

## Locked product decisions (v1)

- **Staff / admin access:** v1 has **no user roles** (no super-admin vs guide vs read-only, etc.). **Any** authenticated back-office user may perform **all** admin operations. Policies and tests should only distinguish **guest vs authenticated** staff, not role tiers.
- **Voyage ↔ boats:** multiple hulls per voyage is **common** — `voyage_boat` (or similar pivot), not a single `boat_id`.
- **Voyage ↔ trip:** `trip_id` nullable; a voyage is linked to zero or one bookable trip.
- **Check-in:** **one check-in per booking (family = one booking).** A check-in **terminal/flow** can **adjust the real person count** vs sold tickets. Check-ins **fill** the voyage; **manual pax / manifest lines** (walk-ons, corrections) are allowed in addition to check-ins.  
- **Payment:** **out of scope for v1** (simplifies booking; voyages and ops are still the core).  
- **Start:** only **human** “start voyage” — no automatic start from schedule.  
- **ETA:** `departure time` + the linked **water route’s** `duration` (no live GPS in v1).  
- **Admin UI:** **Quasar** — **public** bundle and **admin** bundle; the **admin bundle must work offline** (PowerSync: sync is **crucial** for operations data, not nice-to-have).

## Data model (backend) — step by step

1. **PostGIS + Magellan** in Docker/CI + PHP: enable `geometry` columns, migrations for **`water_routes`**: `name`, `trace` (`LineString`), `duration` (e.g. minutes or `interval`).
2. **`boat_types`** — as today for trip catalog; **trips** reference `boat_type_id` and **`water_route_id`** (and schedule/capacity fields as you build the bookable model).
3. **`boats`** — physical hull: label, `boat_type_id`, registration, etc.
4. **`voyages`** — `trip_id` nullable, **`water_route_id`** (if no trip, required; if trip, inherit or denormalize from trip per your preference), `scheduled_departure_at` (or time + date fields), `started_at` / `arrived_at`, `status` (`draft | ready | underway | completed | cancelled` — tune names), `eta_cached_at` optional. **Do not** set `boat_id` on the voyage as single source: use pivot (step 5).
5. **`voyage_boat`** — `voyage_id`, `boat_id` (and optional sort/`is_lead` if needed). Created/updated when staff **starts** the voyage (or edit before underway).
6. **`guides`** — display name, contact, **`user_id` optional** (guide without login = null).
7. **`voyage_guide`** (or order column on a pivot) — which guides for this voyage, set at start via **multi-select**.
8. **Check-in / manifest** — `check_ins`: `booking_id` (or equivalent), `voyage_id` once attached, **adjusted** adult/child (or type breakdown) counts, timestamps; support **extra manifest rows** not tied to a booking (manual entries) linked to the same voyage. One row per booking for the “family” rule; line items can still roll up counts for the ops board.
9. **Pax on board** — roll up from check-ins + manual lines for the voyage; keep consistent with **ticket types** (ratio rules) when booking exists.

## API & state machine

10. **Policies** — v1: any authenticated staff user may start/complete voyages and manage programs; use policies to reject **unauthenticated** access and for validation rules, not for staff role matrices.
11. **Transitions** — e.g. `startVoyage`: idempotent, sets `started_at`, status `underway`, persists **boats** + **guides** from the form; recompute `eta` = `scheduled_departure_at` + the resolved **`water_routes.duration`** (v1: not `started_at`). `markArrived` → `arrived_at`, `completed`.
12. **Audit** — who started / who closed the voyage, for support.

## PowerSync & offline (v1 = first-class)

13. **Tables to sync to admin clients** (minimum): **`water_routes`** (+ GeoJSON for map when online), `boats`, `boat_types`, `voyages`, `voyage_boat`, `guides`, `voyage_guide`, `check_ins` / manifest lines, and anything the **bookings domain** needs for check-in. Define **uplink** (writes from device) and **conflict** rules (e.g. start voyage: single-writer per voyage, queue retries; or CRDT for counters — keep v1 **simple and explicit**).
14. **TanStack DB** in admin: optimistic start/arrive; reconcile when sync reconnects. Document which actions are **allowed offline** (e.g. start voyage offline → queue until server confirms) vs **forbidden** if you need server inventory checks.
15. **Map draw** for **`water_routes`** may require **online** authoring in v1, while **read** of trace works offline on the board after sync.

## Admin UI (Quasar, admin bundle)

16. **Water route editor** — draw `LineString` on map, set duration, name; save to API, syncs down.
17. **Ops board** — voyages with `status` in (ready/boarding, underway): trip/program label, **water route** name, **departure time**, **ETA** (= scheduled departure + **`water_routes.duration`**, v1), pax rollups, **boat** names, **guide** names, **Start voyage** / **Mark arrived**.  
18. **Start voyage** modal — **multi-select boats** (filtered by trip’s `boat_type` or all of type), **multi-select guides**, optional notes; no payment step in v1.
19. **Check-in** — associating bookings to a **voyage**, adjusted counts, manual rows as needed; works **offline** per sync design.

## Testing

20. **PHPUnit** — voyage lifecycle, policy, **ETA = scheduled_departure + water route `duration`**; PostGIS in CI. **Feature tests** for `startVoyage` with N boats and M guides.

## Order relative to the priority list above

- **Trips** must expose **boat type** + **water route** before voyages that reference a trip are meaningful; **Voyage** with `trip_id` null can be built first for field testing.
- **Check-in** model depends on **bookings** existing (even without payment) — at least a booking + line items.  
- **Ratio rules** and displayed PAX should share the same notion of “adult/child” (or ticket-type buckets).  
- **Water routes** (PostGIS) and **Voyage** CRUD can proceed in parallel with a minimal booking stub, then connect end-to-end.

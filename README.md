Local-first pwa based on tanstack-db + powersync. Using quasar.dev components and laravel backend.
Optimistic update.

# Implementation steps:

## Priority:

[x] Design architecture for separating responsability cleanly in the frontend
[x] Install powersync
[x] Programs (base: name, description, theme, address, media; admin create; synced)
[] Public program link + booking flow (no account required to pay / hold seats)
[] Booking questions at checkout: collect name, email, country, plus admin-defined personalized questions per trip/program
[] Ticket types per program (Zeffy-like: title, price, PWYC, min/max per purchase, inventory per **trip**)
[] **Companion / ratio rules** between ticket types (see below)
[] **Trips** as bookable units (date, capacity, link to a **template** or ad-hoc description)
[] Template day with defined trips (reusable “what runs on a typical day”)
[] Assign template days to calendar days
[] Manually add trips to calendar day

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

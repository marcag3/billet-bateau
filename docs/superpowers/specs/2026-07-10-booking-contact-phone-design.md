# Booking contact phone (optional)

## Problem

Operators sometimes need to call a booking contact (e.g. late passenger). Bookings
today only store `contact_name` and `contact_email`. There is no phone number.

## Goal

Add an optional `contact_phone` on bookings so:

- Public and admin booking flows can collect it
- Operators can see it in the admin bookings list and edit forms
- It syncs via PowerSync like other booking contact fields

## Non-goals

- Echoing the phone back in client emails/notifications (the client already knows it)
- SMS / WhatsApp / calling integrations
- Strict E.164 normalization or country-specific parsing
- Search/filter by phone
- Dedicated DB index on phone

## Approach

Mirror `contact_email`: nullable string column, soft validation, same surfaces
(public booking, walk-in, admin edit, PowerSync, admin list).

## Data model

- New nullable column `bookings.contact_phone` (`string`, no default index)
- Migration via `php artisan make:migration` (do not edit existing migrations)
- Add to `Booking` `$fillable`
- Factory: optional faker phone when useful for tests
- PowerSync:
  - Include `contact_phone` in `deploy/config/powersync/sync-config.yaml` bookings SELECT
  - Client schema: `resources/js/powersync/bookings.collection.ts` and
    `resources/js/powersync/app.powersync-schema.ts` if the table columns are listed there
- DTOs / resolvers (same pattern as `contact_email`):
  - `PublicBookingStoreData` — optional nullable
  - PowerSync `BookingPutData`, `BookingPatchData`, `BookingResolvedPutData`,
    `BookingPutPayloadResolver`
  - `CreatePublicBookingAction` and related create/update paths that persist contact fields

## Validation

Shared rule (frontend Zod + backend Laravel):

- Empty / null / whitespace-only → store as `null` (optional)
- Otherwise: trim, max length **40**
- Allowed characters only: digits and `+`, spaces, `(`, `)`, `.`, `-`
  - Regex: `^[+\d\s().-]+$`
- No further format checks (Canadian formats like `(514) 555-1234` and other
  international-looking values both pass if they match the character set)

Frontend: add a small helper next to `zOptionalTrimmedEmail` in
`resources/js/validation/zod-fields.ts` (e.g. `zOptionalTrimmedPhone`) and
reuse it in public / walk-in / admin booking Zod schemas.

Backend: `nullable`, `string`, `max:40`, and a matching `regex` rule where the
field is accepted.

## UI

- Public contact step (`PublicProgramBookingContactStep.vue` + parent wiring):
  optional `q-input` `type="tel"` after email
- Admin walk-in dialog and booking edit form: same field after email
- Admin bookings table (`AppControlBookingsPage.vue`): new column for phone so
  operators can dial without opening the edit dialog
- i18n FR/EN labels (+ short Canadian-style hint, e.g. `(514) 555-1234`)
- Quasar defaults only; no custom styling

## Data flow

1. Public API create: client sends optional `contact_phone` → validated → stored
2. Admin create/update via PowerSync CRUD: same field on put/patch payloads
3. Sync down: `program_scope` bookings query includes `contact_phone`
4. Admin list/edit read from local PowerSync collection

## Error handling

- Invalid phone → field validation error (form / API 422), same UX as invalid email
- Missing phone → allowed everywhere

## Testing

- Zod unit tests: empty OK; Canadian-style OK; loose international OK; reject letters
- Feature: public booking store with/without phone; invalid phone rejected
- PowerSync upload path: put/patch with optional phone (extend existing booking
  PowerSync tests if present)
- Update existing form/validation tests that assert contact field shapes

## Out of scope follow-ups

- Click-to-call `tel:` links in the admin UI (nice-to-have later)
- Showing phone on check-in / control-panel trip views beyond the bookings list

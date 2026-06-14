# Collection Realignment — All Entities

## Problem

All 10 remaining PowerSync collections (boat_types, boats, trips, ticket_types, water_routes, booking_tickets, template_days, template_day_slots, template_day_dates, media) use Option 1 (bare type inference — no schema, no deserializationSchema, no onDeserializationError). Query results return raw SQLite types. Model composable wrappers (`useBoats()`, `useBoatTypes()`, etc.) sit between components and TanStack DB collections.

## Scope

Apply the same Option 4 schema migration done for `programs` to all 10 remaining entities:
1. Typed collection files with Zod schemas (input/output types + deserialization)
2. Direct collection consumption by components (remove model composable wrappers)
3. Proper deserialization for any SQLite integer→boolean columns

## Implementation Plan

See `docs/superpowers/plans/2026-05-02-collection-realignment-all-entities.md`.

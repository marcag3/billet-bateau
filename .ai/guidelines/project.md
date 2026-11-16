# Billet Bateau

Local-first, fully offline PWA for running boat-tour operations (programs, trips, voyages, bookings, check-in) over unstable networks. A Laravel API serves one caller: the Vue 3 + Quasar app in `resources/js`.

## Breaking changes

Prefer clean breaking changes: change the API and its one caller together, without shims, aliases or dual paths.

The exception is **PowerSync upload payloads**. An offline device keeps its queued writes in the old shape across a deploy. When the device reconnects, the server rejects those writes (logged as `PowerSync upload entry rejected.` with the full entry) and the client drops them from its queue. Before you ship a change to an upload payload shape, drain every device's queue.

## Data ownership

Program and fleet data is shared by a program's staff. Authorize through program membership (`Program::userCanManage()`) and policies. A `user_id` column on these tables is audit metadata (who created the row), not a visibility filter, and that holds for Eloquent queries, PowerSync sync streams and Vue alike.

## Frontend

Build from Quasar components and rely on Quasar's default styling. Before writing a component, reuse one from `resources/js/components` (`ui`, `molecules`, `organisms`). Keep new components as small, reusable atoms or molecules.

## Commits

`<gitmoji> [scope] message`: a unicode emoji from gitmoji.dev, an optional scope, and a short "what" (no "why").

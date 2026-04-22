Local-First Todo List with TanStack DB + ElectricSQL (Through-the-Database Pattern)
The Core Idea
Electric handles read-path sync (Postgres → PGlite), and a changelog synchronizer handles write-path sync (PGlite → Postgres via your API). All your app code ever talks to is the local PGlite database — networking is fully abstracted away.

Data Flow
Postgres (server)
↕ [READ] Electric sync (shapes)
↕ [WRITE] REST API ← ChangeLogSynchronizer
PGlite (in-browser Postgres)
├── todos_synced (immutable, owned by Electric)
├── todos_local (shadow table, optimistic writes)
├── todos (VIEW merging both)
├── changes (changelog, drives write-path)
└── triggers (INSTEAD OF → redirect + log writes)
↕
TanStack Electric collection (live queries on the view)
↕
TanStack DB / useCollection()
↕
Vue components

Local Schema — The Clever Part
This is where most of the complexity lives, hidden away from your app code:
todos_synced — Electric writes here, your app never touches it directly.
todos_local — Optimistic writes land here. Persisted in IndexedDB via PGlite, so they survive page reloads.
todos (VIEW) — Merges todos_local over todos_synced. Your app reads and writes exclusively to this view.
INSTEAD OF triggers — When your app does INSERT/UPDATE/DELETE on the todos view, triggers silently redirect those writes to todos_local and append an entry to the changes table.
changes table — A simple log: { id, operation, row_data, synced }. The synchronizer drains this.
Merge trigger — When Electric confirms a write back via todos_synced, a trigger automatically deletes the corresponding row from todos_local, cleaning up the optimistic state.

ChangeLogSynchronizer
A small background utility (a class you instantiate once at app boot) that:

Listens for NOTIFY events from PGlite (fired by the changes insert trigger)
On notification, reads unsynced rows from the changes table
POSTs each change to your REST API (POST /todos, PATCH /todos/:id, DELETE /todos/:id)
On success, marks the change as synced (or deletes it)
On failure, leaves it — it will retry, or you can surface a conflict/error to the user

What Your Vue Component Looks Like
Extremely simple — no API calls, no loading states for writes:

const todos = useCollection(todoCollection) // reactive, from TanStack

function addTodo(text) {
todoCollection.insert({ id: crypto.randomUUID(), text, done: false })
}

function toggleTodo(todo) {
todoCollection.update({ ...todo, done: !todo.done })
}

function deleteTodo(id) {
todoCollection.delete(id)
}

The view updates instantly (optimistic), syncs in the background, and Electric confirms the round-trip.

TanStack DB's mutation layer is what handles the optimistic update in the reactive store, and it's also where you'd define the mutationFn that ultimately writes to PGlite (which then triggers the changelog → synchronizer → API chain).
So the corrected flow for writes is:
Vue component
→ TanStack DB mutation (optimistic update in collection)
→ mutationFn writes SQL to PGlite
→ INSTEAD OF trigger fires
→ todos_local updated + changes table appended
→ NOTIFY fires
→ ChangeLogSynchronizer sends to REST API
→ Postgres updated
→ Electric syncs back to todos_synced
→ merge trigger cleans up todos_local

What You Need to Stand This Up
PieceWhat it isPostgres + Electric serviceDocker Compose, Electric reads the WALREST API3 endpoints: POST, PATCH, DELETE on /todosPGlite (IndexedDB)Local persistent Postgres in the browserlocal-schema.sqlViews, shadow tables, triggers, changes tableChangeLogSynchronizer~100 lines, listens + drains the changelogTanStack Electric collectionBridges Electric shapes → TanStack DBuseCollection() in VueReactive todo list in your component

reference: https://electric-sql.com/docs/guides/writes#through-the-db

---
name: electricsql-tanstack-db
description: Builds local-first apps with ElectricSQL and TanStack DB using secure server-defined shapes, Electric proxy patterns, txid-based optimistic reconciliation, and live query architecture. Use when implementing or reviewing Electric sync, TanStack DB collections, optimistic mutations, shape auth, or migrations from TanStack Query.
---

# ElectricSQL + TanStack DB

Audience: coding agents and codegen tools.

Use this skill to ship fast, reliable local-first apps by pairing:
- ElectricSQL for Postgres read-path sync over HTTP
- TanStack DB for embedded client collections, live queries, and optimistic writes

## When to apply

Apply immediately when work includes:
- Electric HTTP shape subscriptions or proxy routes
- TanStack DB collections, `useLiveQuery`, joins, or aggregations
- optimistic mutations with `onInsert`/`onUpdate`/`onDelete`
- Postgres write APIs that must return a `txid`
- migration from TanStack Query collections to Electric collections
- troubleshooting shape performance, auth, or reconciliation flicker

## Security rules (always)

1. Never expose `SOURCE_SECRET` to browsers. Inject it only server-side.
2. Treat Electric HTTP API as public-by-default. Enforce auth in proxy/server.
3. Put Electric behind your server/proxy in production. Do not call Electric directly from clients.
4. Define shapes server-side. Do not allow client-defined `table` / `where` / `columns`.

## Core architecture

- Electric handles read-path sync: Postgres -> Electric shape stream -> client collection.
- TanStack DB handles client state, optimistic transactions, and live queries.
- Electric Collection is a drop-in replacement for query-based collections in many cases:
  - `queryCollectionOptions(...)` -> `electricCollectionOptions(...)`
  - keep component query code mostly unchanged.

## Golden implementation path

### 1) Build a secure Electric proxy route

Server/proxy responsibilities:
- forward Electric protocol query params needed by stream continuity
- set shape definition server-side (`table`, optional constrained `where`, `columns`)
- inject `source_id` and `secret` from server env
- strip/normalize hop-by-hop headers when returning streamed responses

Example essentials:

```ts
import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from '@electric-sql/client'

// copy only protocol params from incoming request
// set table/where/params on server
// set source_id + secret from process.env
```

### 2) Create Electric-backed collection

Use `electricCollectionOptions` with:
- stable collection id
- runtime schema validation
- deterministic key extractor
- `shapeOptions.url` pointing to your proxy route
- mutation handlers that call API and return `{ txid }`

```ts
const todos = createCollection(
  electricCollectionOptions({
    id: 'todos',
    schema: todoSchema,
    getKey: (row) => row.id,
    shapeOptions: { url: '/api/todos' },
    onInsert: async ({ transaction }) => {
      const row = transaction.mutations[0].modified
      const { txid } = await api.todos.create(row)
      return { txid }
    },
  })
)
```

### 3) Enforce write-path contract (mandatory)

1. UI mutates collection (optimistic update is immediate).
2. Collection handler calls backend API (`onInsert`/`onUpdate`/`onDelete`).
3. Backend writes to Postgres and returns transaction id.
4. Client reconciles when Electric stream includes that tx; optimistic state is dropped.

Backend txid query:

```sql
SELECT pg_current_xact_id()::xid::text AS txid;
```

Return txid as an integer/string format your client parser expects; stay consistent end-to-end.

## Shape constraints

- Shape subscriptions are single-table with optional `where` and `columns`.
- If using `columns`, include the primary key.
- Shape definitions are immutable per subscription; for dynamic filters, build a collection factory instead of mutating one live shape.

## Live query guidance

Prefer `useLiveQuery` for UI reads:
- filter/order/limit in query, not in render loops
- include dependency array for dynamic query inputs
- use joins and grouped projections for derived views

Pattern:

```ts
const { data } = useLiveQuery(
  (q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, false))
      .orderBy(({ todo }) => todo.created_at, 'desc')
      .limit(50),
  []
)
```

## Optimistic mutation patterns

### Direct collection mutations

- insert via `collection.insert(...)`
- update via `collection.update(id, draft => { ... })`
- delete via `collection.delete(id)`

### Multi-collection optimistic actions

Use `createOptimisticAction` when a single intent mutates multiple collections, then await tx reconciliation across all affected collections.

```ts
await Promise.all([
  listCollection.utils.awaitTxId(txid),
  todoCollection.utils.awaitTxId(txid),
])
```

## Testing workflow

### Unit tests (mocked)

- mock `shapeOptions.fetchClient`
- assert error-handling behavior through `shapeOptions.onError`
- test optimistic mutation semantics independent of network

### Integration tests (real services)

For TypeScript packages that depend on real sync behavior, run tests against:
- PostgreSQL
- Electric
- Nginx (or equivalent proxy)

If sync-service changes are on your branch, build a local Electric image instead of relying on canary.

## TypeScript client invariant

Before modifying `packages/typescript-client`, read `packages/typescript-client/SPEC.md` first.
Treat the spec as source of truth for ShapeStream invariants and state transitions. Fix root-cause invariant violations, not symptoms.

## Critical gotchas

1. Use latest compatible `@electric-sql/*` and `@tanstack/*-db` packages.
2. Keep txid handshake intact; missing await/reconcile causes optimistic flicker.
3. Slow local shapes often come from HTTP/1.1 connection limits; use HTTP/2 proxy or Electric Cloud.
4. Proxy must preserve Electric protocol params and required headers.
5. Parse custom DB types explicitly in `shapeOptions.parser` (for example `timestamptz` to `Date`).

## Migration notes (from older patterns)

- Old Electric "electrify + direct writes" style is obsolete in this stack.
- Preferred write path is collection mutation -> API -> Postgres txid -> Electric reconcile.
- Prefer TanStack DB collections over low-level Shape/ShapeStream/useShape for app-facing data flows.

## Quick checklist

- [ ] proxy route defines shape server-side
- [ ] no browser access to `SOURCE_SECRET`
- [ ] mutation handlers return txid
- [ ] client awaits tx reconciliation where needed
- [ ] live queries express filters/ordering declaratively
- [ ] shape `columns` include primary key
- [ ] `packages/typescript-client/SPEC.md` consulted before TS client changes

## References

- [Electric HTTP API](https://electric-sql.com/docs/api/http.md)
- [Electric Security Guide](https://electric-sql.com/docs/guides/security.md)
- [Electric Shapes Guide](https://electric-sql.com/docs/guides/shapes.md)
- [TanStack DB Overview](https://tanstack.com/db/latest/docs/overview.md)
- [TanStack Electric Collection](https://tanstack.com/db/latest/docs/collections/electric-collection.md)
- [TanStack Live Queries](https://tanstack.com/db/latest/docs/guides/live-queries.md)

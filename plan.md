# Local-First Todo List: TanStack DB + ElectricSQL (Pattern 3)

## Overview

Electric handles **read-path sync** (Postgres → client) and TanStack DB's `ElectricCollection` handles **optimistic state management** and the **write-path lifecycle**. Your app code talks exclusively to TanStack DB collections — all sync machinery is abstracted away.

---

## Architecture

```
Postgres (server)
  ↕ [READ]  Electric (WAL → shape stream → ElectricCollection)
  ↕ [WRITE] REST API ← onInsert / onUpdate / onDelete handlers

TanStack DB ElectricCollection
  ├── synced state     (owned by Electric, immutable from app perspective)
  ├── optimistic state (managed internally by TanStack DB)
  └── merged view      (what your components see — always up to date)
       ↕
Vue components via useCollection() / useLiveQuery()
```

---

## Local persistence (reloads and restarts)

The SQLite persistence adapter stores synced collection state on disk (browser SQLite/OPFS), so data survives reloads and restarts. Restarts are fast because the app can render from local disk first, then reconcile with the stream.

```
ElectricCollection  →  SQLite (browser/OPFS)  →  survives reload, fast startup
```

**Writes** are handled by `onInsert` / `onUpdate` / `onDelete` on the Electric collection (HTTP to your API when online). This app does not queue pending writes in an IndexedDB outbox: offline or failed network calls surface as normal handler errors and optimistic rollbacks, not a separate durable mutation queue.

---

## Data Flow

### Read path

```
Postgres WAL
  → Electric service (shape stream)
  → ElectricCollection (synced state store)
  → live query / useCollection()
  → Vue component re-renders reactively
```

### Write path

```
Vue component calls todoCollection.insert() / .update() / .delete()
  → TanStack DB applies optimistic state immediately
  → UI updates instantly (zero network wait)
  → onInsert / onUpdate / onDelete handler fires
  → handler POSTs / PATCHes / DELETEs to REST API
  → Postgres writes the row (inside a transaction)
  → API returns { txid } from pg_current_xact_id()
  → handler returns { txid } to TanStack DB
  → TanStack DB calls awaitTxId(txid)
  → Electric syncs the confirmed row back to the collection
  → optimistic state is dropped, replaced by server-confirmed state

On failure:
  → handler throws
  → TanStack DB automatically rolls back optimistic state
  → UI reverts to last confirmed state
```

---

## What You Need

| Piece                | What it is                                              | Notes                                                      |
| -------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| **Postgres**         | Your database                                           | Any hosted or local Postgres                               |
| **Electric service** | Docker container, reads Postgres WAL                    | Exposes `/v1/shape` HTTP endpoint                          |
| **REST API**         | 3 endpoints: `POST`, `PATCH`, `DELETE /todos`           | Each must return `{ txid }` from within the DB transaction |
| **TanStack DB**      | `@tanstack/vue-db` + `@tanstack/electric-db-collection` | Reactive collection, optimistic state, rollbacks           |
| **Local persistence**| SQLite persistence adapter                               | Persists synced state locally (OPFS), survives reloads     |
| **Vue components**   | `useCollection()` / `useLiveQuery()`                    | Reactive, no manual state management                       |

**No shadow tables. No triggers. No changelog. No ChangeLogSynchronizer.**

---

## Infrastructure: Docker Compose

```yaml
services:
    postgres:
        image: postgres:16
        environment:
            POSTGRES_DB: todos
            POSTGRES_USER: postgres
            POSTGRES_PASSWORD: password
        command: postgres -c wal_level=logical # required for Electric
        ports:
            - "5432:5432"

    electric:
        image: electricsql/electric:latest
        environment:
            DATABASE_URL: postgresql://postgres:password@postgres:5432/todos
        ports:
            - "3003:3003"
        depends_on:
            - postgres

    api:
        build: ./api
        environment:
            DATABASE_URL: postgresql://postgres:password@postgres:5432/todos
        ports:
            - "3001:3001"
        depends_on:
            - postgres
```

---

## Database Schema

Simple — just your production table. No shadow tables, no triggers.

```sql
CREATE TABLE todos (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT    NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## REST API

Three endpoints. The critical requirement: **`pg_current_xact_id()` must be called inside the same transaction as the mutation**, or the returned `txid` won't match what Electric streams back and `awaitTxId` will hang.

```ts
// POST /api/todos
app.post("/api/todos", async (req, res) => {
    const { id, text, done } = req.body;
    const { rows } = await db.query(
        `
    WITH ins AS (
      INSERT INTO todos (id, text, done)
      VALUES ($1, $2, $3)
    )
    SELECT pg_current_xact_id()::text AS txid
  `,
        [id, text, done],
    );
    res.json({ txid: rows[0].txid });
});

// PATCH /api/todos/:id
app.patch("/api/todos/:id", async (req, res) => {
    const { done, text } = req.body;
    const { rows } = await db.query(
        `
    WITH upd AS (
      UPDATE todos SET done = $1, text = $2 WHERE id = $3
    )
    SELECT pg_current_xact_id()::text AS txid
  `,
        [done, text, req.params.id],
    );
    res.json({ txid: rows[0].txid });
});

// DELETE /api/todos/:id
app.delete("/api/todos/:id", async (req, res) => {
    const { rows } = await db.query(
        `
    WITH del AS (
      DELETE FROM todos WHERE id = $1
    )
    SELECT pg_current_xact_id()::text AS txid
  `,
        [req.params.id],
    );
    res.json({ txid: rows[0].txid });
});
```

---

## TanStack DB Collection

### Install

```bash
npm install @tanstack/vue-db @tanstack/db @tanstack/electric-db-collection
```

### Collection definition

```ts
// collections/todos.ts
import { createCollection } from "@tanstack/vue-db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { z } from "zod";

const todoSchema = z.object({
    id: z.string().uuid(),
    text: z.string(),
    done: z.boolean(),
    created_at: z.string(),
});

export type Todo = z.infer<typeof todoSchema>;

export const todoCollection = createCollection(
    electricCollectionOptions({
        id: "todos",
        schema: todoSchema,
        getKey: (item) => item.id,

        shapeOptions: {
            url: "http://localhost:3003/v1/shape",
            params: { table: "todos" },
        },

        onInsert: async ({ transaction }) => {
            const item = transaction.mutations[0].modified;
            const res = await fetch("/api/todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
            });
            if (!res.ok) throw new Error("Insert failed");
            const { txid } = await res.json();
            return { txid };
        },

        onUpdate: async ({ transaction }) => {
            const { original, changes } = transaction.mutations[0];
            const res = await fetch(`/api/todos/${original.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(changes),
            });
            if (!res.ok) throw new Error("Update failed");
            const { txid } = await res.json();
            return { txid };
        },

        onDelete: async ({ transaction }) => {
            const { original } = transaction.mutations[0];
            const res = await fetch(`/api/todos/${original.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            const { txid } = await res.json();
            return { txid };
        },
    }),
);
```

---

## Vue Component

The component has zero knowledge of networking, sync, or optimistic state — that's all handled by TanStack DB.

```vue
<script setup lang="ts">
import { useCollection } from "@tanstack/vue-db";
import { todoCollection, type Todo } from "@/collections/todos";

const todos = useCollection(todoCollection, {
    select: (collection) =>
        [...collection.values()].sort((a, b) =>
            a.created_at.localeCompare(b.created_at),
        ),
});

function addTodo(text: string) {
    todoCollection.insert({
        id: crypto.randomUUID(),
        text,
        done: false,
        created_at: new Date().toISOString(),
    });
}

function toggleTodo(todo: Todo) {
    todoCollection.update(todo.id, (draft) => {
        draft.done = !draft.done;
    });
}

function deleteTodo(id: string) {
    todoCollection.delete(id);
}
</script>

<template>
    <ul>
        <li v-for="todo in todos" :key="todo.id">
            <input
                type="checkbox"
                :checked="todo.done"
                @change="toggleTodo(todo)"
            />
            <span :class="{ done: todo.done }">{{ todo.text }}</span>
            <button @click="deleteTodo(todo.id)">Delete</button>
        </li>
    </ul>
</template>
```

---

## Optimistic State Lifecycle (What TanStack DB Does For You)

| Step                                                       | Who does it               |
| ---------------------------------------------------------- | ------------------------- |
| Write called on collection                                 | Your component            |
| Optimistic state applied, UI updates                       | TanStack DB (instant)     |
| `onInsert` / `onUpdate` / `onDelete` fires                 | TanStack DB               |
| HTTP request to REST API                                   | Your handler              |
| `{ txid }` returned from handler                           | Your handler              |
| Waits for Electric to stream back the confirmed row        | TanStack DB (`awaitTxId`) |
| Optimistic state dropped, replaced by server-confirmed row | TanStack DB               |
| On any error: automatic rollback, UI reverts               | TanStack DB               |

---

## Advanced: Multi-Collection Writes with `createOptimisticAction`

For writes that touch multiple collections atomically (e.g. creating a todo and updating a counter), use `createOptimisticAction`:

```ts
import { createOptimisticAction } from "@tanstack/db";

const addTodoAction = createOptimisticAction<{ text: string }>({
    onMutate: ({ text }) => {
        // all optimistic writes here are staged atomically
        todoCollection.insert({
            id: crypto.randomUUID(),
            text,
            done: false,
            created_at: new Date().toISOString(),
        });
        // statsCollection.update(...) — other collections can go here
    },
    mutationFn: async ({ text }) => {
        const res = await fetch("/api/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, done: false }),
        });
        if (!res.ok) throw new Error("Failed");
        const { txid } = await res.json();
        await todoCollection.utils.awaitTxId(txid);
        // if any of the above throws, all optimistic state is rolled back
    },
});
```

---

## Key Constraints and Gotchas

**`txid` must come from within the same DB transaction as the mutation.**
Using a separate `SELECT pg_current_xact_id()` query after the fact returns a different transaction ID. The shape stream will never emit that ID and `awaitTxId` will time out silently. Use a CTE (`WITH ... AS (INSERT ...) SELECT pg_current_xact_id()`) to keep everything in one transaction.

**Client-generated UUIDs are required.**
Because optimistic state is applied before the server responds, the `id` must be generated client-side (`crypto.randomUUID()`). Your Postgres schema should accept a provided `id` rather than generating one server-side.

**Rollback is automatic — but you should handle errors in the UI.**
TanStack DB rolls back optimistic state on handler failure, but it does not surface the error to the user automatically. Add error handling at the component level or via a global error boundary.

**The shape URL should be proxied in production.**
Don't expose the Electric service directly. Route `/api/shape/*` through your API server so you can add auth headers and avoid CORS issues.

---

## Project Structure

```
project/
├── docker-compose.yml
├── api/
│   ├── index.ts          # Express/Hono server
│   └── routes/todos.ts   # POST, PATCH, DELETE — each returns { txid }
├── src/
│   ├── collections/
│   │   └── todos.ts      # electricCollectionOptions with handlers
│   ├── components/
│   │   └── TodoList.vue  # useCollection(), insert/update/delete calls
│   └── main.ts
└── schema.sql            # CREATE TABLE todos (...)
```

---

## References

- Electric blog: TanStack DB 0.6 app-ready with persistence and includes
  - https://electric-sql.com/blog/2026/03/25/tanstack-db-0.6-app-ready-with-persistence-and-includes
- TanStack release post: DB 0.6 includes persistence, offline support, and hierarchical data
  - https://tanstack.com/blog/tanstack-db-0.6-app-ready-with-persistence-and-includes

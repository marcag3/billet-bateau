import { getPgliteClient } from './pglite.client';
import { ensurePgliteSchema } from './pglite.schema';

let repositoryReadyPromise = null;

async function getRepositoryClient() {
    if (repositoryReadyPromise !== null) {
        return repositoryReadyPromise;
    }

    repositoryReadyPromise = (async () => {
        const pg = await getPgliteClient();
        await ensurePgliteSchema(pg);
        return pg;
    })();

    return repositoryReadyPromise;
}

function mapTodoRow(row) {
    return {
        id: String(row.id),
        title: String(row.title ?? ''),
        completed: Boolean(row.completed),
        created_at: row.created_at ? String(row.created_at) : null,
        updated_at: row.updated_at ? String(row.updated_at) : null,
    };
}

export async function listLocalTodos() {
    const pg = await getRepositoryClient();
    const result = await pg.query(
        `
            SELECT id, title, completed, created_at, updated_at
            FROM todos_local
            ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        `,
    );

    return result.rows.map(mapTodoRow);
}

export async function replaceLocalTodos(todos) {
    const pg = await getRepositoryClient();

    await pg.transaction(async (tx) => {
        await tx.query('DELETE FROM todos_local');

        for (let index = 0; index < todos.length; index += 1) {
            const todo = todos[index];

            await tx.query(
                `
                    INSERT INTO todos_local (id, title, completed, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    String(todo.id),
                    String(todo.title ?? ''),
                    Boolean(todo.completed),
                    todo.created_at ? String(todo.created_at) : null,
                    todo.updated_at ? String(todo.updated_at) : null,
                ],
            );
        }
    });
}

function mapPendingMutationRow(row) {
    let payload = undefined;

    if (typeof row.payload === 'string' && row.payload.length > 0) {
        try {
            payload = JSON.parse(row.payload);
        } catch {
            payload = undefined;
        }
    }

    return {
        type: String(row.mutation_type),
        id: String(row.todo_id),
        ...(payload === undefined ? {} : { payload }),
    };
}

export async function readPendingTodoMutations() {
    const pg = await getRepositoryClient();
    const result = await pg.query(
        `
            SELECT position, mutation_type, todo_id, payload
            FROM todo_mutation_queue
            ORDER BY position ASC
        `,
    );

    return result.rows.map(mapPendingMutationRow);
}

export async function writePendingTodoMutations(mutations) {
    const pg = await getRepositoryClient();

    await pg.transaction(async (tx) => {
        await tx.query('DELETE FROM todo_mutation_queue');

        for (let index = 0; index < mutations.length; index += 1) {
            const mutation = mutations[index];
            const payload =
                mutation.payload === undefined ? null : JSON.stringify(mutation.payload);

            await tx.query(
                `
                    INSERT INTO todo_mutation_queue (
                        position,
                        mutation_type,
                        todo_id,
                        payload,
                        updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    index + 1,
                    String(mutation.type),
                    String(mutation.id),
                    payload,
                    new Date().toISOString(),
                ],
            );
        }
    });
}

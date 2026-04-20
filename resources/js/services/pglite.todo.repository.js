import { getPgliteClient } from './pglite.client';

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
    const pg = await getPgliteClient();
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
    const pg = await getPgliteClient();

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

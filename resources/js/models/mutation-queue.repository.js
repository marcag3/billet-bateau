import { getPgliteClient } from '../services/pglite.client';

function mapPendingMutationRow(row) {
    let payload = undefined;

    if (typeof row.payload === 'string' && row.payload.length > 0) {
        try {
            payload = JSON.parse(row.payload);
        } catch {
            payload = undefined;
        }
    }

    const outboxId = typeof row.outbox_id === 'string' ? row.outbox_id : '';

    return {
        type: String(row.mutation_type),
        id: String(row.entity_id),
        ...(payload === undefined ? {} : { payload }),
        ...(outboxId.length === 0 ? {} : { outboxId }),
    };
}

export function createMutationQueueRepository(entityName) {
    const normalizedEntityName = String(entityName ?? '').trim();

    if (normalizedEntityName.length === 0) {
        throw new Error('[models] Mutation queue repository requires a non-empty entity name.');
    }

    return {
        async read() {
            const pg = await getPgliteClient();
            const result = await pg.query(
                `
                    SELECT position, mutation_type, entity_id, payload, outbox_id
                    FROM mutation_queue
                    WHERE entity_name = $1
                    ORDER BY position ASC
                `,
                [normalizedEntityName],
            );

            return result.rows.map(mapPendingMutationRow);
        },

        async write(mutations) {
            const pg = await getPgliteClient();

            await pg.transaction(async (tx) => {
                await tx.query(
                    `
                        DELETE FROM mutation_queue
                        WHERE entity_name = $1
                    `,
                    [normalizedEntityName],
                );

                for (let index = 0; index < mutations.length; index += 1) {
                    const mutation = mutations[index];
                    const payload =
                        mutation.payload === undefined ? null : JSON.stringify(mutation.payload);
                    const outboxId = typeof mutation.outboxId === 'string' ? mutation.outboxId : null;

                    await tx.query(
                        `
                            INSERT INTO mutation_queue (
                                entity_name,
                                position,
                                mutation_type,
                                entity_id,
                                payload,
                                outbox_id,
                                updated_at
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `,
                        [
                            normalizedEntityName,
                            index + 1,
                            String(mutation.type),
                            String(mutation.id),
                            payload,
                            outboxId,
                            new Date().toISOString(),
                        ],
                    );
                }
            });
        },
    };
}

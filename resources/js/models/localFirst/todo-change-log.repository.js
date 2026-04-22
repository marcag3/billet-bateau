import { getPgliteClient } from '../../services/pglite.client';
import { SYNC_STATUS } from '../sync.status';

/**
 * @param {string} entityName
 */
export function createTodoChangeLogRepository(entityName) {
    const normalizedEntityName = String(entityName ?? '').trim();

    if (normalizedEntityName.length === 0) {
        throw new Error('[todo-change-log] entity name is required.');
    }

    return {
        normalizedEntityName,

        async listPendingFlushable() {
            const pg = await getPgliteClient();
            const result = await pg.query(
                `
                    SELECT id, op, record_id, payload, synced, error, updated_at
                    FROM todo_changes
                    WHERE entity_name = $1
                        AND synced = false
                        AND (error IS NULL OR error = '')
                    ORDER BY id ASC
                `,
                [normalizedEntityName],
            );

            return result.rows.map((row) => ({
                id: Number(row.id),
                op: String(row.op),
                recordId: String(row.record_id),
                payload: typeof row.payload === 'string' && row.payload.length > 0 ? row.payload : null,
                synced: Boolean(row.synced),
                error: row.error === null || row.error === undefined ? '' : String(row.error),
                updatedAt: String(row.updated_at ?? ''),
            }));
        },

        async listPendingDisplay() {
            const pg = await getPgliteClient();
            const result = await pg.query(
                `
                    SELECT id, op, record_id, payload, synced, error, updated_at
                    FROM todo_changes
                    WHERE entity_name = $1 AND synced = false
                    ORDER BY id ASC
                `,
                [normalizedEntityName],
            );

            return result.rows.map((row) => ({
                id: Number(row.id),
                op: String(row.op),
                recordId: String(row.record_id),
                payload: typeof row.payload === 'string' && row.payload.length > 0 ? row.payload : null,
                synced: Boolean(row.synced),
                error: row.error === null || row.error === undefined ? '' : String(row.error),
                updatedAt: String(row.updated_at ?? ''),
            }));
        },

        async markSynced(changeId) {
            const pg = await getPgliteClient();
            const updatedAt = new Date().toISOString();

            await pg.query(
                `
                    UPDATE todo_changes
                    SET synced = true, error = NULL, updated_at = $1
                    WHERE id = $2 AND entity_name = $3
                `,
                [updatedAt, changeId, normalizedEntityName],
            );
        },

        async markFailed(changeId, message) {
            const pg = await getPgliteClient();
            const updatedAt = new Date().toISOString();
            const error = String(message ?? '').slice(0, 2000);

            await pg.query(
                `
                    UPDATE todo_changes
                    SET error = $1, updated_at = $2
                    WHERE id = $3 AND entity_name = $4
                `,
                [error, updatedAt, changeId, normalizedEntityName],
            );
        },

        async deleteLocalShadow(recordId) {
            const pg = await getPgliteClient();

            await pg.query(`DELETE FROM todos_local WHERE id = $1`, [String(recordId)]);
        },

        /**
         * @param {{
         *   id: string,
         *   title: string,
         *   completed: boolean,
         *   created_at?: string,
         *   updated_at?: string,
         * }} row
         * @returns {Promise<number>} todo_changes.id
         */
        async persistInsertShadowAndEnqueue(row) {
            const pg = await getPgliteClient();
            const now = new Date().toISOString();
            const createdAt = typeof row.created_at === 'string' ? row.created_at : now;
            const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : now;
            const payload = JSON.stringify({
                id: row.id,
                title: row.title,
                completed: Boolean(row.completed),
                created_at: createdAt,
                updated_at: updatedAt,
            });

            const result = await pg.transaction(async (tx) => {
                await tx.query(
                    `
                        INSERT INTO todos_local (id, title, completed, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (id) DO UPDATE SET
                            title = EXCLUDED.title,
                            completed = EXCLUDED.completed,
                            created_at = EXCLUDED.created_at,
                            updated_at = EXCLUDED.updated_at
                    `,
                    [String(row.id), String(row.title), Boolean(row.completed), createdAt, updatedAt],
                );

                const insertChange = await tx.query(
                    `
                        INSERT INTO todo_changes (entity_name, op, record_id, payload, synced, error, updated_at)
                        VALUES ($1, 'insert', $2, $3, false, NULL, $4)
                        RETURNING id
                    `,
                    [normalizedEntityName, String(row.id), payload, now],
                );

                return insertChange.rows[0]?.id;
            });

            const changeId = typeof result === 'bigint' ? Number(result) : Number(result);

            if (!Number.isFinite(changeId)) {
                throw new Error('[todo-change-log] persistInsert failed.');
            }

            return changeId;
        },

        /**
         * @param {{
         *   id: string,
         *   title: string,
         *   completed: boolean,
         *   created_at?: string,
         *   updated_at?: string,
         * }} mergedRow
         * @param {Record<string, unknown>} patch
         * @returns {Promise<number>}
         */
        async persistUpdateShadowAndEnqueue(mergedRow, patch) {
            const pg = await getPgliteClient();
            const now = new Date().toISOString();
            const createdAt = typeof mergedRow.created_at === 'string' ? mergedRow.created_at : now;
            const updatedAt = typeof mergedRow.updated_at === 'string' ? mergedRow.updated_at : now;
            const payload = JSON.stringify(patch);

            const result = await pg.transaction(async (tx) => {
                await tx.query(
                    `
                        INSERT INTO todos_local (id, title, completed, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (id) DO UPDATE SET
                            title = EXCLUDED.title,
                            completed = EXCLUDED.completed,
                            created_at = EXCLUDED.created_at,
                            updated_at = EXCLUDED.updated_at
                    `,
                    [
                        String(mergedRow.id),
                        String(mergedRow.title),
                        Boolean(mergedRow.completed),
                        createdAt,
                        updatedAt,
                    ],
                );

                const insertChange = await tx.query(
                    `
                        INSERT INTO todo_changes (entity_name, op, record_id, payload, synced, error, updated_at)
                        VALUES ($1, 'update', $2, $3, false, NULL, $4)
                        RETURNING id
                    `,
                    [normalizedEntityName, String(mergedRow.id), payload, now],
                );

                return insertChange.rows[0]?.id;
            });

            const changeId = typeof result === 'bigint' ? Number(result) : Number(result);

            if (!Number.isFinite(changeId)) {
                throw new Error('[todo-change-log] persistUpdate failed.');
            }

            return changeId;
        },

        /**
         * @param {string} recordId
         * @returns {Promise<number>}
         */
        async persistDeleteEnqueue(recordId) {
            const pg = await getPgliteClient();
            const now = new Date().toISOString();

            const result = await pg.transaction(async (tx) => {
                await tx.query(`DELETE FROM todos_local WHERE id = $1`, [String(recordId)]);

                const insertChange = await tx.query(
                    `
                        INSERT INTO todo_changes (entity_name, op, record_id, payload, synced, error, updated_at)
                        VALUES ($1, 'delete', $2, NULL, false, NULL, $3)
                        RETURNING id
                    `,
                    [normalizedEntityName, String(recordId), now],
                );

                return insertChange.rows[0]?.id;
            });

            const changeId = typeof result === 'bigint' ? Number(result) : Number(result);

            if (!Number.isFinite(changeId)) {
                throw new Error('[todo-change-log] persistDelete failed.');
            }

            return changeId;
        },

        /**
         * @returns {Promise<Array<{ id: string, type: string, recordId: string, title: string, status: string, error: string }>>}
         */
        async readPendingOutboxEntries() {
            const rows = await this.listPendingDisplay();

            return rows.map((row) => {
                let title = '';
                if (typeof row.payload === 'string' && row.payload.length > 0) {
                    try {
                        const parsed = JSON.parse(row.payload);
                        const rawTitle = parsed?.title;
                        title = typeof rawTitle === 'string' ? rawTitle : '';
                    } catch {
                        title = '';
                    }
                }

                const hasError = typeof row.error === 'string' && row.error.length > 0;

                return {
                    id: `change-${row.id}`,
                    type: row.op,
                    recordId: row.recordId,
                    title,
                    status: hasError ? SYNC_STATUS.failed : SYNC_STATUS.queued,
                    error: row.error,
                };
            });
        },
    };
}

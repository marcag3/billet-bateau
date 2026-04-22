/**
 * Frontend-owned migration (not generated from Laravel). Converts entity-specific mutation queue
 * tables into a shared queue keyed by `entity_name`.
 */
export const version = 3;
export const name = 'generic-mutation-queue';

export const generatedSql = [
    `CREATE TABLE IF NOT EXISTS mutation_queue (
        entity_name TEXT NOT NULL,
        position INTEGER NOT NULL,
        mutation_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload TEXT,
        outbox_id TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (entity_name, position)
    );`,
    `CREATE INDEX IF NOT EXISTS mutation_queue_entity_lookup ON mutation_queue (entity_name, entity_id);`,
    `INSERT INTO mutation_queue (
        entity_name,
        position,
        mutation_type,
        entity_id,
        payload,
        outbox_id,
        updated_at
    )
    SELECT
        'todos',
        position,
        mutation_type,
        todo_id,
        payload,
        NULL,
        updated_at
    FROM todo_mutation_queue
    WHERE NOT EXISTS (
        SELECT 1
        FROM mutation_queue AS existing
        WHERE existing.entity_name = 'todos'
    );`,
];

export function statements() {
    return generatedSql;
}

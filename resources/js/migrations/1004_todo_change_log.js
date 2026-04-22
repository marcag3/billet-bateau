/**
 * Frontend-owned migration. Durable write-path log for through-the-DB local-first sync.
 * Replaces mutation_queue as the primary pending-write store (breaking).
 */
export const version = 1004;
export const name = 'todo-change-log';

export const generatedSql = [
    `DROP TABLE IF EXISTS todo_mutation_queue;`,
    `DROP TABLE IF EXISTS mutation_queue;`,
    `CREATE TABLE IF NOT EXISTS todo_changes (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        entity_name TEXT NOT NULL DEFAULT 'todos',
        op TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload TEXT,
        synced BOOLEAN NOT NULL DEFAULT FALSE,
        error TEXT,
        updated_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS todo_changes_entity_pending
        ON todo_changes (entity_name, synced, id);`,
];

export function statements() {
    return generatedSql;
}

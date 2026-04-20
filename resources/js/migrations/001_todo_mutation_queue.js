/**
 * Frontend-owned migration (not generated from Laravel). Local mutation queue for offline sync.
 */
export const version = 2;
export const name = 'todo-mutation-queue';

export const generatedSql = [
    `CREATE TABLE IF NOT EXISTS todo_mutation_queue (
        position INTEGER PRIMARY KEY,
        mutation_type TEXT NOT NULL,
        todo_id TEXT NOT NULL,
        payload TEXT,
        updated_at TEXT NOT NULL
    );`,
];

export function statements() {
    return generatedSql;
}

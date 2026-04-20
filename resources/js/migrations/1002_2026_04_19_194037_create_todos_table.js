/**
 * AUTO-GENERATED FILE. Run `php artisan frontend:migrations:export` after backend schema changes.
 * source-migration: 2026_04_19_194037_create_todos_table.php
 * backend-source-hash: 8aba0f276da71882e93e0edfc3579c56ec6bbd9b7271da48ee8a84b88d91b035
 */
export const version = 1002;
export const name = '2026-04-19-194037-create-todos-table';

export const generatedSql = [
    `CREATE TABLE IF NOT EXISTS todos_local (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NULL,
    updated_at TEXT NULL
);`,
];

export function statements() {
    return generatedSql;
}

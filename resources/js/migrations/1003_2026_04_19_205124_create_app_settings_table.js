/**
 * AUTO-GENERATED FILE. Run `php artisan frontend:migrations:export` after backend schema changes.
 * source-migration: 2026_04_19_205124_create_app_settings_table.php
 * backend-source-hash: 8aba0f276da71882e93e0edfc3579c56ec6bbd9b7271da48ee8a84b88d91b035
 */
export const version = 1003;
export const name = '2026-04-19-205124-create-app-settings-table';

export const generatedSql = [
    `CREATE TABLE IF NOT EXISTS app_settings_local (
    id BIGINT NOT NULL PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NULL,
    updated_at TEXT NULL
);`,
];

export function statements() {
    return generatedSql;
}

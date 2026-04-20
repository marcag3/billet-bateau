/**
 * AUTO-GENERATED FILE. Run `php artisan frontend:migrations:export` after backend schema changes.
 * source-migration: 0001_01_01_000000_create_users_table.php
 * backend-source-hash: 8aba0f276da71882e93e0edfc3579c56ec6bbd9b7271da48ee8a84b88d91b035
 */
export const version = 1001;
export const name = '0001-01-01-000000-create-users-table';

export const generatedSql = [
    `CREATE TABLE IF NOT EXISTS users_local (
    id BIGINT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    email_verified_at TEXT NULL,
    password TEXT NOT NULL,
    remember_token TEXT NULL,
    created_at TEXT NULL,
    updated_at TEXT NULL
);`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens_local (
    email TEXT NOT NULL PRIMARY KEY,
    token TEXT NOT NULL,
    created_at TEXT NULL
);`,
    `CREATE TABLE IF NOT EXISTS sessions_local (
    id TEXT NOT NULL PRIMARY KEY,
    ip_address TEXT NULL,
    user_agent TEXT NULL,
    payload TEXT NOT NULL,
    last_activity BIGINT NOT NULL
);`,
];

export function statements() {
    return generatedSql;
}

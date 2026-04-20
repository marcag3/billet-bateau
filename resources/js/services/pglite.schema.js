export const PGLITE_SCHEMA_VERSION = '1';

export async function ensurePgliteSchema(pg) {
    await pg.exec(`
        CREATE TABLE IF NOT EXISTS app_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS todos_local (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS todo_mutation_queue (
            position INTEGER PRIMARY KEY,
            mutation_type TEXT NOT NULL,
            todo_id TEXT NOT NULL,
            payload TEXT,
            updated_at TEXT NOT NULL
        );
    `);

    await pg.query(
        `
            INSERT INTO app_meta (key, value)
            VALUES ('schema_version', $1)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `,
        [PGLITE_SCHEMA_VERSION],
    );
}

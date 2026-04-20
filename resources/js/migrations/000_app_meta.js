/**
 * Frontend-owned migration (not generated from Laravel). Holds local schema bookkeeping.
 */
export const version = 1;
export const name = 'app-meta';

export const generatedSql = [
    `CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );`,
];

export function statements() {
    return generatedSql;
}

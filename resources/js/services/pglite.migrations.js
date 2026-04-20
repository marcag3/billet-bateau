const SCHEMA_VERSION_KEY = 'schema_version';

/**
 * @returns {Promise<number>}
 */
async function readAppliedSchemaVersion(pg) {
    try {
        const result = await pg.query(
            `SELECT value FROM app_meta WHERE key = $1`,
            [SCHEMA_VERSION_KEY],
        );
        const raw = result.rows[0]?.value;

        if (raw === undefined || raw === null) {
            return 0;
        }

        const parsed = parseInt(String(raw), 10);

        return Number.isFinite(parsed) ? parsed : 0;
    } catch {
        return 0;
    }
}

/**
 * @returns {Promise<Array<{ version: number, name: string, statements: () => string[] }>>}
 * Sorts by `version` then `name`. Hand-authored modules should use `version` below 1000; Laravel-exported modules use 1001+.
 */
async function loadMigrationModules() {
    const modules = import.meta.glob('../migrations/*.js', { eager: true });
    const loaded = [];

    for (const path of Object.keys(modules)) {
        if (path.includes('.export.meta') || path.endsWith('contract.json')) {
            continue;
        }

        const mod = modules[path];
        if (!mod || typeof mod !== 'object') {
            continue;
        }

        const version = mod.version;
        const name = mod.name;
        const statementsFn = mod.statements;

        if (typeof version !== 'number' || typeof name !== 'string' || typeof statementsFn !== 'function') {
            continue;
        }

        loaded.push({
            version,
            name,
            statements: statementsFn,
        });
    }

    loaded.sort((a, b) => {
        if (a.version !== b.version) {
            return a.version - b.version;
        }

        return a.name.localeCompare(b.name);
    });

    return loaded;
}

/**
 * Runs versioned PGlite migrations, advancing `app_meta.schema_version` only after each migration completes successfully.
 *
 * @param {import('@electric-sql/pglite').PGlite} pg
 */
export async function runPgliteMigrations(pg) {
    const migrations = await loadMigrationModules();

    if (migrations.length === 0) {
        return;
    }

    let current = await readAppliedSchemaVersion(pg);

    for (const migration of migrations) {
        if (migration.version <= current) {
            continue;
        }

        const sqlSteps = migration.statements();

        await pg.transaction(async (tx) => {
            for (const sql of sqlSteps) {
                if (typeof sql !== 'string' || sql.trim().length === 0) {
                    continue;
                }

                await tx.exec(sql);
            }

            await tx.query(
                `
                    INSERT INTO app_meta (key, value)
                    VALUES ($1, $2)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                `,
                [SCHEMA_VERSION_KEY, String(migration.version)],
            );
        });

        current = migration.version;
    }
}

import { createBrowserWASQLitePersistence, openBrowserWASQLiteOPFSDatabase } from '@tanstack/browser-db-sqlite-persistence';

const DEFAULT_DB_NAME = 'billbateau-app';

/** @type {Promise<import('@tanstack/browser-db-sqlite-persistence').PersistedCollectionPersistence | null> | null} */
let persistenceInitPromise = null;

/**
 * Shared browser SQLite (OPFS + wa-sqlite) persistence for TanStack DB collections.
 * Returns null when OPFS / workers are unavailable (SSR, tests, locked-down browsers).
 *
 * @returns {Promise<import('@tanstack/browser-db-sqlite-persistence').PersistedCollectionPersistence | null>}
 */
export function ensureBrowserSqlitePersistence() {
    if (typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    persistenceInitPromise ??= (async () => {
        try {
            const database = await openBrowserWASQLiteOPFSDatabase({
                databaseName: DEFAULT_DB_NAME,
            });

            return createBrowserWASQLitePersistence({ database });
        } catch {
            return null;
        }
    })();

    return persistenceInitPromise;
}

/**
 * @returns {Promise<void>}
 */
export async function resetBrowserSqlitePersistenceForTests() {
    persistenceInitPromise = null;
}

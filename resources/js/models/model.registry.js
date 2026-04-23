/**
 * Central bootstrap for domain models (Electric-backed TanStack DB collections).
 */
import { ensureBrowserSqlitePersistence } from './persistence/browser-sqlite-persistence.js';
import { bootstrapTodos } from './todos/todos.model.js';

/**
 * Ordered domain model bootstraps. Register a new model by importing its bootstrap and adding one entry.
 *
 * @type {Record<string, () => Promise<unknown>>}
 */
export const domainModelBootstraps = {
    todos: bootstrapTodos,
};

/**
 * Initializes shared browser persistence (OPFS SQLite when available) then boots each registered domain model.
 *
 * @returns {Promise<void>}
 */
export async function bootstrapDomainModels() {
    await ensureBrowserSqlitePersistence();

    for (const bootstrap of Object.values(domainModelBootstraps)) {
        await bootstrap();
    }
}

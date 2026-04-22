/**
 * Central bootstrap for domain models (Electric-backed TanStack DB collections).
 */
import { ensureBrowserSqlitePersistence } from './persistence/browser-sqlite-persistence.js';
import { bootstrapTodos } from './todos/todos.model.js';

/**
 * Initializes shared browser persistence (OPFS SQLite when available) then boots each domain model.
 *
 * @returns {Promise<void>}
 */
export async function bootstrapDomainModels() {
    await ensureBrowserSqlitePersistence();
    await bootstrapTodos();
    // Future: await bootstrapOtherModel();
}

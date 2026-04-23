/**
 * Central bootstrap for domain models (PowerSync-backed TanStack DB collections).
 */
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
 * Boots each registered domain model (each model owns its PowerSync database + TanStack collection).
 *
 * @returns {Promise<void>}
 */
export async function bootstrapDomainModels() {
    for (const bootstrap of Object.values(domainModelBootstraps)) {
        await bootstrap();
    }
}

/**
 * Central bootstrap for local-first domain models (Electric + PGlite change log).
 */
import { bootstrapTodos } from './todos/todos.model.js';

export function bootstrapLocalFirstModels() {
    void bootstrapTodos();
}

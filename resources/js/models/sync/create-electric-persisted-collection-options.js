import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { wrapCollectionSyncWritesForJsonSafeRows } from '../persistence/json-safe-rows.js';

/**
 * Electric read sync + optional SQLite persistence + JSON-safe sync writes.
 * Mutations are expected to run via @tanstack/offline-transactions (no onInsert/onUpdate/onDelete here).
 *
 * @param {{
 *   model: import('../model.definition.js').ModelDefinition,
 *   sqlitePersistence: import('@tanstack/browser-db-sqlite-persistence').PersistedCollectionPersistence | null,
 * }} args
 * @returns {Record<string, unknown>}
 */
export function createElectricPersistedCollectionOptions({ model, sqlitePersistence }) {
    const shapeUrl = model.shapeUrl;
    const url = typeof shapeUrl === 'function' ? shapeUrl() : shapeUrl;

    const electricOptions = electricCollectionOptions({
        id: model.collectionId,
        getKey: (item) => String(item[model.idKey ?? 'id']),
        shapeOptions: {
            url,
        },
    });

    const base = !sqlitePersistence
        ? electricOptions
        : persistedCollectionOptions({
              ...electricOptions,
              persistence: sqlitePersistence,
              schemaVersion: model.persistenceSchemaVersion,
          });

    return wrapCollectionSyncWritesForJsonSafeRows(base);
}

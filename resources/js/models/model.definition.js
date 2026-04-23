/**
 * @typedef {{
 *   name: string,
 *   collectionId: string,
 *   persistenceSchemaVersion: number,
 *   idKey?: string,
 *   api: {
 *     create: (payload: Record<string, unknown>, options?: { idempotencyKey?: string }) => Promise<Record<string, unknown>>,
 *     update: (id: string, payload: Record<string, unknown>, options?: { idempotencyKey?: string }) => Promise<Record<string, unknown>>,
 *     remove: (id: string, options?: { idempotencyKey?: string }) => Promise<Record<string, unknown>>,
 *   },
 *   titleFromPayload?: (payload: Record<string, unknown>) => string,
 *   orderBy?: Array<{ key: string, direction?: 'asc' | 'desc' }>,
 *   relations?: Record<string, unknown>,
 *   pickUpdatePayload?: (changes: Record<string, unknown>) => Record<string, unknown>,
 * }} ModelDefinition
 */

/**
 * @param {ModelDefinition} definition
 * @returns {ModelDefinition}
 */
export function defineModel(definition) {
    const normalizedName = String(definition?.name ?? '').trim();
    const normalizedCollectionId = String(definition?.collectionId ?? '').trim();

    if (normalizedName.length === 0) {
        throw new Error('[models] Model definition requires a non-empty "name".');
    }

    if (normalizedCollectionId.length === 0) {
        throw new Error('[models] Model definition requires a non-empty "collectionId".');
    }

    if (!definition || typeof definition.api !== 'object') {
        throw new Error(`[models] Model "${normalizedName}" requires an "api" contract.`);
    }

    const { create, update, remove } = definition.api;
    if (typeof create !== 'function' || typeof update !== 'function' || typeof remove !== 'function') {
        throw new Error(`[models] Model "${normalizedName}" must define api.create/api.update/api.remove.`);
    }

    const schemaVersion = definition.persistenceSchemaVersion;
    if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
        throw new Error(
            `[models] Model "${normalizedName}" requires a positive integer "persistenceSchemaVersion" (bump when the persisted collection shape changes).`,
        );
    }

    return {
        idKey: 'id',
        orderBy: [],
        titleFromPayload: (payload) => {
            const title = payload?.title;
            return typeof title === 'string' ? title : '';
        },
        ...definition,
        name: normalizedName,
        collectionId: normalizedCollectionId,
        persistenceSchemaVersion: schemaVersion,
    };
}

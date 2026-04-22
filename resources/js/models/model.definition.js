/**
 * @typedef {{
 *   name: string,
 *   collectionId: string,
 *   idKey?: string,
 *   shapeUrl: string | (() => string),
 *   api: {
 *     create: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>,
 *     update: (id: string, payload: Record<string, unknown>) => Promise<Record<string, unknown>>,
 *     remove: (id: string) => Promise<Record<string, unknown>>,
 *   },
 *   titleFromPayload?: (payload: Record<string, unknown>) => string,
 *   orderBy?: Array<{ key: string, direction?: 'asc' | 'desc' }>,
 *   relations?: Record<string, unknown>,
 *   persistenceSchemaVersion?: number,
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

    if (typeof definition.shapeUrl !== 'string' && typeof definition.shapeUrl !== 'function') {
        throw new Error(`[models] Model "${normalizedName}" requires a shapeUrl string or resolver.`);
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
    };
}

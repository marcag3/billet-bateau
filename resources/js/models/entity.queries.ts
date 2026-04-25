import { useLiveQuery } from '@tanstack/vue-db';
import { isRef, unref } from 'vue';

function applyOrdering(query, alias, orderBy = []) {
    let current = query;

    for (const clause of orderBy) {
        const key = typeof clause?.key === 'string' ? clause.key : '';
        if (key.length === 0) {
            continue;
        }

        const direction = clause?.direction === 'asc' ? 'asc' : 'desc';
        current = current.orderBy((sources) => sources[alias][key], direction);
    }

    return current;
}

/**
 * Live list from a TanStack DB collection with optional ordering.
 *
 * @param {object} options
 * @param {import('vue').Ref<boolean> | undefined} options.enabledRef When false, query is disabled.
 * @param {string} options.alias Table alias in the query (matches model `name`).
 * @param {import('vue').Ref<import('@tanstack/db').Collection | null> | import('@tanstack/db').Collection} options.collection
 * @param {Array<{ key: string, direction?: string }>} [options.orderBy]
 */
export function useEntityList({ enabledRef, alias, collection, orderBy = [] }) {
    const collectionDeps = isRef(collection) ? [collection] : [];

    return useLiveQuery(
        (queryBuilder) => {
            if (enabledRef && enabledRef.value === false) {
                return undefined;
            }

            const resolvedCollection = unref(collection);
            if (!resolvedCollection) {
                return undefined;
            }

            const query = queryBuilder.from({ [alias]: resolvedCollection });
            return applyOrdering(query, alias, orderBy);
        },
        [enabledRef, ...collectionDeps].filter(Boolean),
    );
}

import { useLiveQuery } from '@tanstack/vue-db';

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

export function buildEntityListQuery({ queryBuilder, alias, collection, where, orderBy = [] }) {
    let query = queryBuilder.from({ [alias]: collection });

    if (typeof where === 'function') {
        query = where(query, alias);
    }

    return applyOrdering(query, alias, orderBy);
}

export function withModelRelations(query, relationHandlers = [], relations = {}) {
    if (!Array.isArray(relationHandlers) || relationHandlers.length === 0) {
        return query;
    }

    let current = query;

    for (const handler of relationHandlers) {
        if (typeof handler !== 'function') {
            continue;
        }

        current = handler(current, relations) ?? current;
    }

    return current;
}

export function useEntityList({ enabledRef, alias, collection, dependencies = [], where, orderBy = [], relationHandlers = [], relations = {} }) {
    return useLiveQuery(
        (queryBuilder) => {
            if (enabledRef && enabledRef.value === false) {
                return undefined;
            }

            const query = buildEntityListQuery({
                queryBuilder,
                alias,
                collection,
                where,
                orderBy,
            });

            return withModelRelations(query, relationHandlers, relations);
        },
        [...dependencies, enabledRef].filter(Boolean),
    );
}

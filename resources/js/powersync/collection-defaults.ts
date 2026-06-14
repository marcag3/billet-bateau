import {
    BasicIndex,
    createCollection,
    type Collection,
    type CollectionConfig,
} from '@tanstack/db';

export const tanstackCollectionDefaults = {
    defaultIndexType: BasicIndex,
    autoIndex: 'eager' as const,
};

function rebuildCollectionIndexes(
    collection: Collection<Record<string, unknown>, string | number>,
): void {
    const entries = [...collection.entries()];
    for (const index of collection.indexes.values()) {
        index.build(entries);
    }
}

export function createAppPowerSyncCollection<
    TOutput extends object,
    TKey extends string | number = string,
    TSchema = never,
>(
    id: string,
    config: Omit<
        CollectionConfig<TOutput, TKey, TSchema>,
        'id' | 'defaultIndexType' | 'autoIndex'
    >,
) {
    const collection = createCollection({
        id,
        ...tanstackCollectionDefaults,
        ...config,
    });

    collection.onFirstReady(() => {
        rebuildCollectionIndexes(
            collection as Collection<Record<string, unknown>, string | number>,
        );
    });

    return collection;
}

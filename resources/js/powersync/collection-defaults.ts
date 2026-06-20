import {
    BasicIndex,
    createCollection,
    type Collection,
    type CollectionConfig,
} from '@tanstack/db';
import type { StandardSchemaV1 } from '@standard-schema/spec';

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
>(
    id: string,
    config: Omit<
        CollectionConfig<TOutput, TKey, StandardSchemaV1>,
        'id' | 'defaultIndexType' | 'autoIndex'
    >,
) {
    const collection = createCollection({
        id,
        ...tanstackCollectionDefaults,
        ...config,
    } as never);

    collection.onFirstReady(() => {
        rebuildCollectionIndexes(
            collection as Collection<Record<string, unknown>, string | number>,
        );
    });

    return collection;
}

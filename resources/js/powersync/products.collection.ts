import { BasicIndex, createCollection } from "@tanstack/db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appProductsPowerSyncTable } from "./app.powersync-schema";

export const productsSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    boat_type_id: z.string().nullable().default(null),
    water_route_id: z.string().nullable().default(null),
    capacity: z.number().int().min(0, "Capacity cannot be negative").nullable().default(null),
    name: z.string().nullable().default(null),
    description: z.string().nullable().default(null),
    banner_object_key: z.string().nullable().default(null),
    banner_mime_type: z.string().nullable().default(null),
    banner_size_bytes: z.number().int().nullable().default(null),
    banner_etag: z.string().nullable().default(null),
    banner_uploaded_at: z.string().nullable().default(null),
});

export type ProductInput = z.input<typeof productsSchema>;
export type ProductOutput = z.output<typeof productsSchema>;

export function createProductsCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appProductsPowerSyncTable,
            schema: productsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);

    return collection;
}

import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { FetchError } from '@electric-sql/client';
import {
    clearElectricTokenCache,
    createTodo,
    deleteTodo,
    getElectricShapeUrl,
    getElectricToken,
    updateTodo,
} from './electricApi';

export const todosCollection = createCollection(
    electricCollectionOptions({
        id: 'todos',
        getKey: (item) => item.id,
        shapeOptions: {
            url: getElectricShapeUrl(),
            params: {
                table: 'todos',
            },
            headers: {
                Authorization: async () => `Bearer ${await getElectricToken()}`,
            },
            onError: async (error) => {
                if (error instanceof FetchError && error.status === 401) {
                    clearElectricTokenCache();

                    return {
                        headers: {
                            Authorization: `Bearer ${await getElectricToken({ forceRefresh: true })}`,
                        },
                    };
                }

                return;
            },
        },
        onInsert: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const response = await createTodo(mutation.modified);

            return { txid: response.txid };
        },
        onUpdate: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const response = await updateTodo(mutation.original.id, mutation.changes);

            return { txid: response.txid };
        },
        onDelete: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const response = await deleteTodo(mutation.original.id);

            return { txid: response.txid };
        },
    }),
);

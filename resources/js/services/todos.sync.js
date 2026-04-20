import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { getElectricShapeUrl } from './electric.api';
import { createTodo, deleteTodo, updateTodo } from './todos.api';

function extractTxid(response, mutationType) {
    if (response?.txid === undefined || response.txid === null) {
        throw new Error(`[todos] Missing txid from ${mutationType} response.`);
    }

    const txid = Number(response.txid);

    if (!Number.isFinite(txid)) {
        throw new Error(`[todos] Invalid txid from ${mutationType} response.`);
    }

    return txid;
}

export const todosCollection = createCollection(
    electricCollectionOptions({
        id: 'todos',
        getKey: (item) => item.id,
        shapeOptions: {
            url: getElectricShapeUrl(),
        },
        onInsert: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const response = await createTodo(mutation.modified);

            return { txid: extractTxid(response, 'insert') };
        },
        onUpdate: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const response = await updateTodo(mutation.original.id, mutation.changes);

            return { txid: extractTxid(response, 'update') };
        },
        onDelete: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const response = await deleteTodo(mutation.original.id);

            return { txid: extractTxid(response, 'delete') };
        },
    }),
);

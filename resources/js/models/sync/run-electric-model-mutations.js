import { NonRetriableError } from '@tanstack/offline-transactions';
import { awaitTxidReconciliation, requireTxid } from '../../services/electric.txid';

/**
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @returns {never}
 */
function throwMutationError(error, fallbackMessage) {
    if (error instanceof NonRetriableError) {
        throw error;
    }

    const message = error instanceof Error ? error.message : fallbackMessage;

    if (error instanceof Error) {
        if (/\b401\b|\b403\b|\b404\b|\b422\b|Unauthenticated|Forbidden/i.test(message)) {
            throw new NonRetriableError(message);
        }
        throw error;
    }

    throw new Error(message);
}

/**
 * Runs REST + txid reconciliation for serialized TanStack DB mutations (insert/update/delete).
 *
 * @param {import('../model.definition.js').ModelDefinition} model
 * @param {import('@tanstack/db').Collection} collection
 * @param {{ mutations: ReadonlyArray<Record<string, unknown>> }} transactionLike
 * @param {{ idempotencyKey?: string }} [options]
 * @returns {Promise<void>}
 */
export async function runElectricModelMutations(model, collection, transactionLike, options = {}) {
    const { idempotencyKey } = options;
    const idKey = model.idKey ?? 'id';
    const txids = [];
    const idem = idempotencyKey ? { idempotencyKey } : {};

    for (const mutation of transactionLike.mutations) {
        try {
            if (mutation.type === 'insert') {
                const modified = mutation.modified;
                const recordId = String(modified[idKey]);
                const response = await model.api.create(
                    {
                        id: recordId,
                        title: String(modified.title ?? ''),
                        completed: Boolean(modified.completed),
                        created_at: modified.created_at,
                        updated_at: modified.updated_at,
                    },
                    idem,
                );
                txids.push(requireTxid(response, 'insert', model.name));
                continue;
            }

            if (mutation.type === 'update') {
                const { original, changes } = mutation;
                const recordId = String(original[idKey]);
                const pick = model.pickUpdatePayload;
                const payload = typeof pick === 'function' ? pick(changes) : changes;
                const response = await model.api.update(recordId, payload, idem);
                txids.push(requireTxid(response, 'update', model.name));
                continue;
            }

            if (mutation.type === 'delete') {
                const { original } = mutation;
                const recordId = String(original[idKey]);
                const response = await model.api.remove(recordId, idem);
                txids.push(requireTxid(response, 'delete', model.name));
                continue;
            }
        } catch (error) {
            throwMutationError(error, 'Sync request failed.');
        }
    }

    const awaitTxId = collection.utils?.awaitTxId;
    if (typeof awaitTxId !== 'function') {
        return;
    }

    for (const txid of txids) {
        await awaitTxidReconciliation(awaitTxId, txid);
    }
}

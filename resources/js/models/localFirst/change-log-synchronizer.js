import { awaitTxidReconciliation, requireTxid } from '../../services/electric.txid';
import { isRecoverableNetworkError } from '../../services/network.errors';
import { registerOnlineQueueFlush } from '../../services/sync.online';
import { SYNC_STATUS } from '../sync.status';

function resolveErrorMessage(error) {
    return error instanceof Error ? error.message : '';
}

/**
 * @param {{
 *   changeLog: ReturnType<typeof import('./todo-change-log.repository.js').createTodoChangeLogRepository>,
 *   api: { create: Function, update: Function, remove: Function },
 *   collection: { utils: { awaitTxId: (txid: number, timeout?: number) => Promise<boolean> } },
 *   modelName: string,
 *   emitLifecycle: (event: Record<string, unknown>) => void,
 *   titleFromPayload: (payload: Record<string, unknown>) => string,
 * }} options
 */
export function createChangeLogSynchronizer({ changeLog, api, collection, modelName, emitLifecycle, titleFromPayload }) {
    let isFlushing = false;

    async function maybeReconcileTxid(txid) {
        await awaitTxidReconciliation(
            (targetTxid, timeoutMs) => collection.utils.awaitTxId(targetTxid, timeoutMs),
            txid,
            15000,
        );
    }

    function emitForRow(row, status, error = '') {
        let title = '';

        if (typeof row.payload === 'string' && row.payload.length > 0) {
            try {
                title = titleFromPayload(JSON.parse(row.payload));
            } catch {
                title = '';
            }
        }

        const event = {
            id: `change-${row.id}`,
            type: row.op,
            recordId: row.recordId,
            title,
            status,
        };

        if (typeof error === 'string' && error.length > 0) {
            event.error = error;
        }

        emitLifecycle(event);
    }

    async function processOne(row) {
        emitForRow(row, SYNC_STATUS.sending);

        try {
            let response;

            if (row.op === 'insert') {
                const payload = JSON.parse(row.payload ?? '{}');
                response = await api.create(payload);
            } else if (row.op === 'update') {
                const payload = JSON.parse(row.payload ?? '{}');
                response = await api.update(row.recordId, payload);
            } else if (row.op === 'delete') {
                response = await api.remove(row.recordId);
            } else {
                throw new Error(`[${modelName}] Unsupported change op: ${row.op}`);
            }

            const txid = requireTxid(response, row.op, modelName);
            await maybeReconcileTxid(txid);
            await changeLog.markSynced(row.id);

            if (row.op === 'insert' || row.op === 'update') {
                await changeLog.deleteLocalShadow(row.recordId);
            }

            emitForRow(row, SYNC_STATUS.synced);
        } catch (error) {
            if (isRecoverableNetworkError(error)) {
                emitForRow(row, SYNC_STATUS.queued);
                throw error;
            }

            await changeLog.markFailed(row.id, resolveErrorMessage(error));
            emitForRow(row, SYNC_STATUS.failed, resolveErrorMessage(error));
        }
    }

    async function flushPendingChanges() {
        if (isFlushing) {
            return;
        }

        isFlushing = true;

        try {
            while (true) {
                const pending = await changeLog.listPendingFlushable();

                if (pending.length === 0) {
                    return;
                }

                const row = pending[0];

                try {
                    await processOne(row);
                } catch (error) {
                    if (isRecoverableNetworkError(error)) {
                        return;
                    }

                    throw error;
                }
            }
        } finally {
            isFlushing = false;
        }
    }

    registerOnlineQueueFlush(flushPendingChanges);

    return {
        flushPendingChanges,
    };
}

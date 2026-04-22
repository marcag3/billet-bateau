import { isRecoverableNetworkError } from '../services/network.errors';
import { SYNC_STATUS } from './sync.status';

export function createMutationMonitor({ setErrorMessage, onLifecycle, onQueuedLifecycleSkipped }) {
    return function monitorPersistence(transaction, outboxEntry, fallbackMessage) {
        void transaction.isPersisted.promise
            .then(() => {
                setErrorMessage('');

                if (!outboxEntry) {
                    return;
                }

                if (typeof onQueuedLifecycleSkipped === 'function' && onQueuedLifecycleSkipped(outboxEntry)) {
                    return;
                }

                onLifecycle({
                    ...outboxEntry,
                    status: SYNC_STATUS.synced,
                    error: '',
                });
            })
            .catch((error) => {
                const message = error instanceof Error ? error.message : fallbackMessage;
                setErrorMessage(message);

                if (!outboxEntry) {
                    return;
                }

                const isRecoverableError = isRecoverableNetworkError(error);
                onLifecycle({
                    ...outboxEntry,
                    status: isRecoverableError ? SYNC_STATUS.queued : SYNC_STATUS.failed,
                    error: isRecoverableError ? '' : message,
                });
            });
    };
}

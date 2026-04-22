export const SYNC_STATUS = {
    sending: 'sending',
    queued: 'queued',
    synced: 'synced',
    failed: 'failed',
};

export function isPendingSyncStatus(status) {
    return status === SYNC_STATUS.sending || status === SYNC_STATUS.queued;
}

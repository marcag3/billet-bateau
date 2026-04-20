function swallowFlushError() {
    // Keep queued operations for a later retry.
}

export function registerOnlineQueueFlush(flushQueue) {
    if (typeof window === 'undefined') {
        return;
    }

    window.addEventListener('online', () => {
        void flushQueue().catch(swallowFlushError);
    });

    void flushQueue().catch(swallowFlushError);
}

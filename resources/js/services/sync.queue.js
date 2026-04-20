export function createSingleFlightQueueFlusher({
    isOnline = () => true,
    readQueue,
    writeQueue,
    runItem,
    isRecoverableError,
}) {
    /** @type {Promise<void> | null} */
    let flushPromise = null;

    return function flushQueue() {
        if (flushPromise !== null) {
            return flushPromise;
        }

        flushPromise = (async () => {
            if (!isOnline()) {
                return;
            }

            const queue = readQueue();
            if (queue.length === 0) {
                return;
            }

            const remaining = [];

            for (let index = 0; index < queue.length; index += 1) {
                const item = queue[index];

                try {
                    await runItem(item);
                } catch (error) {
                    if (isRecoverableError(error)) {
                        remaining.push(item);
                        continue;
                    }

                    remaining.push(item, ...queue.slice(index + 1));
                    writeQueue(remaining);
                    throw error;
                }
            }

            writeQueue(remaining);
        })().finally(() => {
            flushPromise = null;
        });

        return flushPromise;
    };
}

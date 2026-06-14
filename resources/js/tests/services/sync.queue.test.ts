import { expect, test } from 'vitest';
import { createSingleFlightQueueFlusher } from '../../services/sync.queue';

test('createSingleFlightQueueFlusher keeps recoverable failures queued', async () => {
    const writes = [];
    const attempted = [];
    const flush = createSingleFlightQueueFlusher({
        readQueue: async () => [{ id: '1' }, { id: '2' }],
        writeQueue: async (queue) => {
            writes.push(queue.map((item) => item.id));
        },
        runItem: async (item) => {
            attempted.push(item.id);
            if (item.id === '1') {
                throw new Error('temporary network issue');
            }
        },
        isRecoverableError: () => true,
    });

    await flush();

    expect(attempted).toEqual(['1', '2']);
    expect(writes).toEqual([['1']]);
});

test('createSingleFlightQueueFlusher stops on non-recoverable failures', async () => {
    const writes = [];
    const attempted = [];
    const flush = createSingleFlightQueueFlusher({
        readQueue: async () => [{ id: '1' }, { id: '2' }, { id: '3' }],
        writeQueue: async (queue) => {
            writes.push(queue.map((item) => item.id));
        },
        runItem: async (item) => {
            attempted.push(item.id);
            if (item.id === '2') {
                throw new Error('validation failed');
            }
        },
        isRecoverableError: (error) => error.message.includes('network'),
    });

    await expect(flush).rejects.toThrow(/validation failed/);
    expect(attempted).toEqual(['1', '2']);
    expect(writes).toEqual([['2', '3']]);
});

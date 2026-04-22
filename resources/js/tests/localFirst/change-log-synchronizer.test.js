import { afterEach, expect, test, vi } from 'vitest';
import { createChangeLogSynchronizer } from '../../models/localFirst/change-log-synchronizer.js';

vi.mock('../../services/sync.online.js', () => ({
    registerOnlineQueueFlush: vi.fn(),
}));

afterEach(() => {
    vi.clearAllMocks();
});

test('flushPendingChanges processes insert, reconciles txid, and marks synced', async () => {
    const row = {
        id: 1,
        op: 'insert',
        recordId: 'todo-1',
        payload: JSON.stringify({ id: 'todo-1', title: 'A', completed: false }),
        synced: false,
        error: '',
        updatedAt: '',
    };

    const changeLog = {
        listPendingFlushable: vi
            .fn()
            .mockResolvedValueOnce([row])
            .mockResolvedValueOnce([]),
        markSynced: vi.fn().mockResolvedValue(undefined),
        deleteLocalShadow: vi.fn().mockResolvedValue(undefined),
        markFailed: vi.fn().mockResolvedValue(undefined),
    };

    const api = {
        create: vi.fn().mockResolvedValue({ data: {}, txid: '42' }),
        update: vi.fn(),
        remove: vi.fn(),
    };

    const collection = {
        utils: {
            awaitTxId: vi.fn().mockResolvedValue(true),
        },
    };

    const emitLifecycle = vi.fn();

    const { flushPendingChanges } = createChangeLogSynchronizer({
        changeLog,
        api,
        collection,
        modelName: 'todos',
        emitLifecycle,
        titleFromPayload: (payload) => (typeof payload.title === 'string' ? payload.title : ''),
    });

    await flushPendingChanges();

    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.create.mock.calls[0][0]).toMatchObject({ id: 'todo-1', title: 'A', completed: false });
    expect(collection.utils.awaitTxId).toHaveBeenCalled();
    expect(changeLog.markSynced).toHaveBeenCalledWith(1);
    expect(changeLog.deleteLocalShadow).toHaveBeenCalledWith('todo-1');
    expect(emitLifecycle.mock.calls.some((call) => call[0].status === 'synced')).toBe(true);
});

test('flushPendingChanges stops on recoverable network errors', async () => {
    const row = {
        id: 2,
        op: 'update',
        recordId: 'todo-2',
        payload: JSON.stringify({ completed: true }),
        synced: false,
        error: '',
        updatedAt: '',
    };

    const changeLog = {
        listPendingFlushable: vi.fn().mockResolvedValue([row]),
        markSynced: vi.fn(),
        deleteLocalShadow: vi.fn(),
        markFailed: vi.fn(),
    };

    const api = {
        create: vi.fn(),
        update: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
        remove: vi.fn(),
    };

    const collection = {
        utils: {
            awaitTxId: vi.fn(),
        },
    };

    const emitLifecycle = vi.fn();

    const { flushPendingChanges } = createChangeLogSynchronizer({
        changeLog,
        api,
        collection,
        modelName: 'todos',
        emitLifecycle,
        titleFromPayload: () => '',
    });

    await flushPendingChanges();

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(changeLog.markSynced).not.toHaveBeenCalled();
    expect(emitLifecycle.mock.calls.some((call) => call[0].status === 'queued')).toBe(true);
});

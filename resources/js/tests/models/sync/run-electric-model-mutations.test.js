import { expect, test, vi } from 'vitest';
import { NonRetriableError } from '@tanstack/offline-transactions';
import { runElectricModelMutations } from '../../../models/sync/run-electric-model-mutations.js';

test('runElectricModelMutations calls create with idempotency key', async () => {
    const create = vi.fn().mockResolvedValue({ txid: 42 });
    const update = vi.fn();
    const remove = vi.fn();

    const model = {
        name: 'todos',
        idKey: 'id',
        api: { create, update, remove },
    };

    const awaitTxId = vi.fn().mockResolvedValue(undefined);
    const collection = { utils: { awaitTxId } };

    await runElectricModelMutations(
        model,
        collection,
        {
            mutations: [
                {
                    type: 'insert',
                    modified: {
                        id: 'todo-1',
                        title: 'A',
                        completed: false,
                        created_at: '2020-01-01T00:00:00.000Z',
                        updated_at: '2020-01-01T00:00:00.000Z',
                    },
                },
            ],
        },
        { idempotencyKey: 'idem-1' },
    );

    expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'todo-1', title: 'A' }),
        { idempotencyKey: 'idem-1' },
    );
    expect(awaitTxId).toHaveBeenCalledWith(42, 15000);
});

test('runElectricModelMutations maps auth-style failures to NonRetriableError', async () => {
    const create = vi.fn().mockRejectedValue(new Error('Request failed with 401'));
    const model = {
        name: 'todos',
        idKey: 'id',
        api: { create, update: vi.fn(), remove: vi.fn() },
    };
    const collection = { utils: { awaitTxId: vi.fn() } };

    await expect(
        runElectricModelMutations(
            model,
            collection,
            {
                mutations: [
                    {
                        type: 'insert',
                        modified: {
                            id: 'todo-1',
                            title: 'A',
                            completed: false,
                        },
                    },
                ],
            },
            {},
        ),
    ).rejects.toBeInstanceOf(NonRetriableError);
});

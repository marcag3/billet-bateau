import { expect, test } from 'vitest';
import { mergePendingMutationQueue } from '../../services/sync.mutation-queue.js';

test('mergePendingMutationQueue merges update payloads', () => {
    const queue = [
        { type: 'insert', id: 'todo-1', payload: { title: 'A', completed: false } },
    ];

    const nextQueue = mergePendingMutationQueue(queue, {
        type: 'update',
        id: 'todo-1',
        payload: { completed: true },
    });

    expect(nextQueue).toEqual([
        { type: 'insert', id: 'todo-1', payload: { title: 'A', completed: true } },
    ]);
});

test('mergePendingMutationQueue drops insert followed by delete', () => {
    const queue = [{ type: 'insert', id: 'todo-1', payload: { title: 'A' } }];
    const nextQueue = mergePendingMutationQueue(queue, {
        type: 'delete',
        id: 'todo-1',
    });

    expect(nextQueue).toEqual([]);
});

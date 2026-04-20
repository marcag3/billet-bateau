export function mergePendingMutationQueue(queue, nextMutation) {
    const existingIndex = queue.findIndex((mutation) => mutation.id === nextMutation.id);

    if (existingIndex === -1) {
        return [...queue, nextMutation];
    }

    const existing = queue[existingIndex];

    if (nextMutation.type === 'insert') {
        const nextQueue = [...queue];
        nextQueue[existingIndex] = nextMutation;
        return nextQueue;
    }

    if (nextMutation.type === 'update') {
        if (existing.type === 'insert' || existing.type === 'update') {
            const nextQueue = [...queue];
            nextQueue[existingIndex] = {
                ...existing,
                payload: {
                    ...existing.payload,
                    ...nextMutation.payload,
                },
            };
            return nextQueue;
        }

        return queue;
    }

    if (nextMutation.type === 'delete') {
        if (existing.type === 'insert') {
            return queue.filter((_, index) => index !== existingIndex);
        }

        const nextQueue = [...queue];
        nextQueue[existingIndex] = nextMutation;
        return nextQueue;
    }

    return queue;
}

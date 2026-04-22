import { createEntitySyncRuntime } from './entity.sync.runtime';
import { createMutationQueueRepository } from './mutation-queue.repository';

export function createModelResource(modelDefinition) {
    const queueRepository = createMutationQueueRepository(modelDefinition.name);

    return createEntitySyncRuntime({
        modelDefinition,
        queueRepository,
    });
}

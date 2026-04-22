import { createModelResource } from './model.resource';
import { todosModelDefinition } from './todos.definition';

const todosResource = createModelResource(todosModelDefinition);

export const todosCollection = todosResource.collection;
export const flushPendingTodoMutations = () => todosResource.flushPendingMutations();
export const readPendingOutboxEntries = () => todosResource.readPendingOutboxEntries();
export const setTodoOutboxLifecycleReporter = (reporter) => todosResource.setOutboxLifecycleReporter(reporter);

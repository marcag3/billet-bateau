import { defineModel } from './model.definition';
import { defineRelations } from './entity.relations';
import { getElectricShapeUrl } from '../services/electric.api';
import { createTodo, deleteTodo, updateTodo } from './todos.api';

export const todosModelDefinition = defineModel({
    name: 'todos',
    collectionId: 'todos',
    shapeUrl: getElectricShapeUrl,
    api: {
        create: createTodo,
        update: updateTodo,
        remove: deleteTodo,
    },
    orderBy: [
        { key: 'updated_at', direction: 'desc' },
        { key: 'created_at', direction: 'desc' },
        { key: 'id', direction: 'desc' },
    ],
    titleFromPayload: (payload) => {
        const title = payload?.title;
        return typeof title === 'string' ? title : '';
    },
    relations: defineRelations([]),
});

import { destroy, store, update } from '../routes/todos';
import { createEntityApi } from './entity.api';

const todosApi = createEntityApi({
    createUrl: () => store.url(),
    updateUrl: (id) => update.url({ todo: id }),
    deleteUrl: (id) => destroy.url({ todo: id }),
});

export const createTodo = (payload) => todosApi.create(payload);

export const updateTodo = (id, payload) => todosApi.update(id, payload);

export const deleteTodo = (id) => todosApi.remove(id);

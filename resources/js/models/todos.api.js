import { requestJson } from '../services/http.client';
import { destroy, store, update } from '../routes/todos';

export async function createTodo(payload) {
    return requestJson(store.url(), {
        method: 'POST',
        withCsrf: true,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

export async function updateTodo(id, payload) {
    return requestJson(update.url({ todo: id }), {
        method: 'PUT',
        withCsrf: true,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

export async function deleteTodo(id) {
    return requestJson(destroy.url({ todo: id }), {
        method: 'DELETE',
        withCsrf: true,
    });
}

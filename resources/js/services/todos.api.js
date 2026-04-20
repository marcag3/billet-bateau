import { requestJson } from './http.client';

export async function createTodo(payload) {
    return requestJson('/api/todos', {
        method: 'POST',
        withCsrf: true,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

export async function updateTodo(id, payload) {
    return requestJson(`/api/todos/${id}`, {
        method: 'PUT',
        withCsrf: true,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

export async function deleteTodo(id) {
    return requestJson(`/api/todos/${id}`, {
        method: 'DELETE',
        withCsrf: true,
    });
}

import { requestJson } from '../services/http.client';

function jsonRequest(url, method, payload) {
    return requestJson(url, {
        method,
        withCsrf: true,
        ...(payload === undefined
            ? {}
            : {
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload),
              }),
    });
}

/**
 * @param {{
 *   createUrl: () => string,
 *   updateUrl: (id: string) => string,
 *   deleteUrl: (id: string) => string,
 * }} routes
 */
export function createEntityApi(routes) {
    return {
        create(payload) {
            return jsonRequest(routes.createUrl(), 'POST', payload);
        },
        update(id, payload) {
            return jsonRequest(routes.updateUrl(id), 'PUT', payload);
        },
        remove(id) {
            return jsonRequest(routes.deleteUrl(id), 'DELETE');
        },
    };
}

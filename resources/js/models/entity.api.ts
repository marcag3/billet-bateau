import { requestJson } from '../services/http.client';

type JsonRequestOpts = {
    body?: unknown;
    idempotencyKey?: string;
};

function jsonRequest(url: string, method: string, opts: JsonRequestOpts = {}) {
    const { body, idempotencyKey } = opts;
    /** @type {Record<string, string>} */
    const headers = {};

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    if (idempotencyKey) {
        headers['Idempotency-Key'] = String(idempotencyKey);
    }

    return requestJson(url, {
        method,
        withCsrf: true,
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
}

type EntityRoutes = {
    createUrl: () => string;
    updateUrl: (id: string) => string;
    deleteUrl: (id: string) => string;
};

export function createEntityApi(routes: EntityRoutes) {
    return {
        create(payload: Record<string, unknown>, options: { idempotencyKey?: string } = {}) {
            return jsonRequest(routes.createUrl(), 'POST', {
                body: payload,
                idempotencyKey: options.idempotencyKey,
            });
        },
        update(id: string, payload: Record<string, unknown>, options: { idempotencyKey?: string } = {}) {
            return jsonRequest(routes.updateUrl(id), 'PUT', {
                body: payload,
                idempotencyKey: options.idempotencyKey,
            });
        },
        remove(id: string, options: { idempotencyKey?: string } = {}) {
            return jsonRequest(routes.deleteUrl(id), 'DELETE', {
                idempotencyKey: options.idempotencyKey,
            });
        },
    };
}

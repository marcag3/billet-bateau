import { requestJson } from '../services/http.client';

/**
 * @param {string} url
 * @param {string} method
 * @param {{ body?: unknown, idempotencyKey?: string }} [opts]
 */
function jsonRequest(url, method, opts = {}) {
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

/**
 * @param {{
 *   createUrl: () => string,
 *   updateUrl: (id: string) => string,
 *   deleteUrl: (id: string) => string,
 * }} routes
 */
export function createEntityApi(routes) {
    return {
        /**
         * @param {Record<string, unknown>} payload
         * @param {{ idempotencyKey?: string }} [options]
         */
        create(payload, options = {}) {
            return jsonRequest(routes.createUrl(), 'POST', {
                body: payload,
                idempotencyKey: options.idempotencyKey,
            });
        },
        /**
         * @param {string} id
         * @param {Record<string, unknown>} payload
         * @param {{ idempotencyKey?: string }} [options]
         */
        update(id, payload, options = {}) {
            return jsonRequest(routes.updateUrl(id), 'PUT', {
                body: payload,
                idempotencyKey: options.idempotencyKey,
            });
        },
        /**
         * @param {string} id
         * @param {{ idempotencyKey?: string }} [options]
         */
        remove(id, options = {}) {
            return jsonRequest(routes.deleteUrl(id), 'DELETE', {
                idempotencyKey: options.idempotencyKey,
            });
        },
    };
}

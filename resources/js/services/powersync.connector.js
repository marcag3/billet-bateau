import { credentials, upload } from '../routes/api/powersync';
import { requestJson } from './http.client';

/**
 * @returns {import('@powersync/common').PowerSyncBackendConnector}
 */
export function createAppPowerSyncConnector() {
    return {
        async fetchCredentials() {
            const res = await requestJson(credentials.url(), {
                method: 'GET',
                withCsrf: true,
            });

            const endpoint = typeof res?.endpoint === 'string' ? res.endpoint : '';
            const token = typeof res?.token === 'string' ? res.token : '';

            if (endpoint.length === 0 || token.length === 0) {
                return null;
            }

            return { endpoint, token };
        },

        /**
         * @param {import('@powersync/common').AbstractPowerSyncDatabase} database
         */
        async uploadData(database) {
            let batch = await database.getCrudBatch(100);

            while (batch !== null) {
                await requestJson(upload.url(), {
                    method: 'POST',
                    withCsrf: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        crud: batch.crud.map((entry) => entry.toJSON()),
                    }),
                });
                await batch.complete();
                batch = await database.getCrudBatch(100);
            }
        },
    };
}

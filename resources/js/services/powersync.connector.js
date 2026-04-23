import { credentials, upload } from '../routes/api/powersync';
import { requestJson } from './http.client';

/**
 * @returns {import('@powersync/common').PowerSyncBackendConnector}
 */
export function createTodosPowerSyncConnector() {
    return {
        async fetchCredentials() {
            const res = await requestJson(credentials.url(), {
                method: 'GET',
                withCsrf: true,
            });

            const endpoint = typeof res?.endpoint === 'string' ? res.endpoint : '';
            const token = typeof res?.token === 'string' ? res.token : '';

            // #region agent log
            try {
                let endpointHost = '';
                try {
                    endpointHost = endpoint.length > 0 ? new URL(endpoint).host : '';
                } catch {
                    endpointHost = 'parse_failed';
                }
                fetch('/api/_cursor-debug/ingest-d855ad', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        sessionId: 'd855ad',
                        runId: 'pre-fix',
                        hypothesisId: 'H4',
                        location: 'powersync.connector.js:fetchCredentials',
                        message: 'powersync credentials parsed',
                        data: {
                            endpointLen: endpoint.length,
                            tokenLen: token.length,
                            endpointHost,
                            willReturnNull: endpoint.length === 0 || token.length === 0,
                        },
                        timestamp: Date.now(),
                    }),
                }).catch(() => {});
            } catch {
                /* ignore */
            }
            // #endregion

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
                // #region agent log
                try {
                    fetch('http://localhost:7565/ingest/392e3314-4174-4627-903d-36c5d530a41d', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd855ad' },
                        body: JSON.stringify({
                            sessionId: 'd855ad',
                            runId: 'pre-fix',
                            hypothesisId: 'H3',
                            location: 'powersync.connector.js:uploadData',
                            message: 'upload batch before requestJson',
                            data: { crudCount: batch.crud.length },
                            timestamp: Date.now(),
                        }),
                    }).catch(() => {});
                } catch {
                    /* ignore */
                }
                // #endregion
                try {
                    await requestJson(upload.url(), {
                        method: 'POST',
                        withCsrf: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            crud: batch.crud.map((entry) => entry.toJSON()),
                        }),
                    });
                } catch (err) {
                    // #region agent log
                    try {
                        fetch('http://localhost:7565/ingest/392e3314-4174-4627-903d-36c5d530a41d', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd855ad' },
                            body: JSON.stringify({
                                sessionId: 'd855ad',
                                runId: 'pre-fix',
                                hypothesisId: 'H3',
                                location: 'powersync.connector.js:uploadData',
                                message: 'upload batch requestJson threw',
                                data: {
                                    errName: err instanceof Error ? err.name : 'non_error',
                                    errMsg: err instanceof Error ? err.message : String(err),
                                },
                                timestamp: Date.now(),
                            }),
                        }).catch(() => {});
                    } catch {
                        /* ignore */
                    }
                    // #endregion
                    throw err;
                }
                await batch.complete();
                batch = await database.getCrudBatch(100);
            }
        },
    };
}

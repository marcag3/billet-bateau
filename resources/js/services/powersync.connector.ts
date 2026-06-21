import type {
    AbstractPowerSyncDatabase,
    PowerSyncBackendConnector,
} from "@powersync/common";
import { credentials, upload } from "../routes/api/powersync";
import { requestJson } from "./http.client";
import {
    parseUploadResults,
    publishUploadRejections,
} from "../powersync/upload-results";

export function createAppPowerSyncConnector(): PowerSyncBackendConnector {
    return {
        async fetchCredentials() {
            const res = await requestJson(credentials.url(), {
                method: "GET",
                withCsrf: true,
            });

            const endpoint =
                typeof res?.endpoint === "string" ? res.endpoint : "";
            const token = typeof res?.token === "string" ? res.token : "";

            if (endpoint.length === 0 || token.length === 0) {
                return null;
            }

            return { endpoint, token };
        },

        async uploadData(database: AbstractPowerSyncDatabase) {
            let batch = await database.getCrudBatch(100);

            while (batch !== null) {
                const payload = await requestJson(upload.url(), {
                    method: "POST",
                    withCsrf: true,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        crud: batch.crud.map((entry) => entry.toJSON()),
                    }),
                });

                await batch.complete();
                publishUploadRejections(parseUploadResults(payload));
                batch = await database.getCrudBatch(100);
            }
        },
    };
}

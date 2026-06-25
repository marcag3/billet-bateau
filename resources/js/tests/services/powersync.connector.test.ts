import { beforeEach, describe, expect, test, vi } from "vitest";
import { createAppPowerSyncConnector } from "../../services/powersync.connector";
import { outboxCommitError } from "../../powersync/powersync-runtime-state";

const requestJson = vi.fn();
const parseUploadResults = vi.fn();
const publishUploadRejections = vi.fn();

vi.mock("../../services/http.client", () => ({
    requestJson: (...args: unknown[]) => requestJson(...args),
}));

vi.mock("../../routes/api/powersync", () => ({
    credentials: { url: () => "/api/powersync/credentials" },
    upload: { url: () => "/api/powersync/upload" },
}));

vi.mock("../../powersync/upload-results", () => ({
    parseUploadResults: (...args: unknown[]) => parseUploadResults(...args),
    publishUploadRejections: (...args: unknown[]) =>
        publishUploadRejections(...args),
}));

type MockBatch = {
    crud: Array<{ toJSON: () => Record<string, unknown> }>;
    complete: ReturnType<typeof vi.fn>;
};

function createMockBatch(
    entries: Array<Record<string, unknown>>,
): MockBatch {
    return {
        crud: entries.map((entry) => ({
            toJSON: () => entry,
        })),
        complete: vi.fn().mockResolvedValue(undefined),
    };
}

describe("createAppPowerSyncConnector uploadData", () => {
    beforeEach(() => {
        outboxCommitError.value = "";
        requestJson.mockReset();
        parseUploadResults.mockReset();
        publishUploadRejections.mockReset();
    });

    test("completes batch and publishes rejections on successful upload response", async () => {
        const batch = createMockBatch([
            {
                op: "PUT",
                type: "voyage_guide",
                id: "01H2",
            },
        ]);
        const getCrudBatch = vi
            .fn()
            .mockResolvedValueOnce(batch)
            .mockResolvedValueOnce(null);
        const database = { getCrudBatch };
        const payload = {
            ok: true,
            results: [
                {
                    id: "01H2",
                    type: "voyage_guide",
                    op: "PUT",
                    status: "rejected",
                    errors: {
                        guide_id: ["The selected guide id is invalid."],
                    },
                },
            ],
        };
        const parsedResults = [
            {
                id: "01H2",
                type: "voyage_guide",
                op: "PUT",
                status: "rejected" as const,
                errors: {
                    guide_id: ["The selected guide id is invalid."],
                },
            },
        ];

        requestJson.mockResolvedValue(payload);
        parseUploadResults.mockReturnValue(parsedResults);

        const connector = createAppPowerSyncConnector();
        await connector.uploadData(database as never);

        expect(batch.complete).toHaveBeenCalledTimes(1);
        expect(parseUploadResults).toHaveBeenCalledWith(payload);
        expect(publishUploadRejections).toHaveBeenCalledWith(parsedResults);
    });

    test("does not complete batch when upload request fails", async () => {
        const batch = createMockBatch([
            {
                op: "PUT",
                type: "programs",
                id: "01H1",
            },
        ]);
        const database = {
            getCrudBatch: vi.fn().mockResolvedValue(batch),
        };

        requestJson.mockRejectedValue(new Error("Request failed with 500"));

        const connector = createAppPowerSyncConnector();

        await expect(connector.uploadData(database as never)).rejects.toThrow(
            "Request failed with 500",
        );

        expect(batch.complete).not.toHaveBeenCalled();
        expect(publishUploadRejections).not.toHaveBeenCalled();
    });
});

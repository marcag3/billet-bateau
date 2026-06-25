import { beforeEach, describe, expect, test, vi } from "vitest";
import {
    formatUploadRejectionMessage,
    parseUploadResults,
    publishUploadRejections,
    rejectedUploadResults,
} from "../../powersync/upload-results";
import { outboxCommitError } from "../../powersync/powersync-runtime-state";

vi.mock("quasar", () => ({
    Notify: {
        create: vi.fn(),
    },
}));

import { Notify } from "quasar";

describe("parseUploadResults", () => {
    test("parses applied and rejected entries", () => {
        const results = parseUploadResults({
            ok: true,
            results: [
                {
                    id: "01H1",
                    type: "programs",
                    op: "PUT",
                    status: "applied",
                },
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
        });

        expect(results).toHaveLength(2);
        expect(results[0]?.status).toBe("applied");
        expect(results[1]?.status).toBe("rejected");
        expect(results[1]?.errors?.guide_id?.[0]).toBe(
            "The selected guide id is invalid.",
        );
    });

    test("returns empty array when results are missing", () => {
        expect(parseUploadResults({ ok: true })).toEqual([]);
    });
});

describe("formatUploadRejectionMessage", () => {
    test("returns first validation message from rejected entries", () => {
        const message = formatUploadRejectionMessage([
            {
                id: "01H1",
                type: "programs",
                op: "PUT",
                status: "applied",
            },
            {
                id: "01H2",
                type: "voyage_guide",
                op: "PUT",
                status: "rejected",
                errors: {
                    guide_id: ["The selected guide id is invalid."],
                },
            },
        ]);

        expect(message).toBe("The selected guide id is invalid.");
    });

    test("returns empty string when no rejections exist", () => {
        expect(
            formatUploadRejectionMessage([
                {
                    id: "01H1",
                    type: "programs",
                    op: "PUT",
                    status: "applied",
                },
            ]),
        ).toBe("");
    });
});

describe("rejectedUploadResults", () => {
    test("filters rejected entries only", () => {
        const results = rejectedUploadResults([
            {
                id: "01H1",
                type: "programs",
                op: "PUT",
                status: "applied",
            },
            {
                id: "01H2",
                type: "boats",
                op: "PUT",
                status: "rejected",
                errors: { capacity: ["Required"] },
            },
        ]);

        expect(results).toHaveLength(1);
        expect(results[0]?.id).toBe("01H2");
    });
});

describe("publishUploadRejections", () => {
    beforeEach(() => {
        outboxCommitError.value = "";
        vi.clearAllMocks();
    });

    test("sets outbox error and notifies when rejections exist", () => {
        publishUploadRejections([
            {
                id: "01H2",
                type: "voyage_guide",
                op: "PUT",
                status: "rejected",
                errors: {
                    guide_id: ["The selected guide id is invalid."],
                },
            },
        ]);

        expect(outboxCommitError.value).toBe(
            "The selected guide id is invalid.",
        );
        expect(Notify.create).toHaveBeenCalledWith({
            type: "negative",
            message: "The selected guide id is invalid.",
        });
    });

    test("does nothing when all entries were applied", () => {
        publishUploadRejections([
            {
                id: "01H1",
                type: "programs",
                op: "PUT",
                status: "applied",
            },
        ]);

        expect(outboxCommitError.value).toBe("");
        expect(Notify.create).not.toHaveBeenCalled();
    });
});

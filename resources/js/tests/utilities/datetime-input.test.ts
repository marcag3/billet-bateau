import { describe, expect, it } from "vitest";
import {
    composeLocalDatetimeFromParts,
    splitLocalDatetimeInputToDateAndTime,
} from "../../utilities/datetime-input";

describe("datetime-input trip helpers", () => {
    it("splitLocalDatetimeInputToDateAndTime splits T separator", () => {
        expect(splitLocalDatetimeInputToDateAndTime("2026-05-10T08:15")).toEqual({
            date: "2026-05-10",
            time: "08:15",
        });
    });

    it("composeLocalDatetimeFromParts adds seconds for Date parsing", () => {
        expect(composeLocalDatetimeFromParts("2026-05-10", "08:15")).toBe(
            "2026-05-10T08:15:00",
        );
    });
});

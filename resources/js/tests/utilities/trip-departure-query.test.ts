import { describe, expect, it } from "vitest";
import {
    isValidCalendarDateYmd,
    isValidTimeHm,
    parseTripCreateDepartureQuery,
} from "../../utilities/trip-departure-query";

describe("trip-departure-query", () => {
    it("isValidCalendarDateYmd rejects invalid calendar dates", () => {
        expect(isValidCalendarDateYmd("2026-02-29")).toBe(false);
        expect(isValidCalendarDateYmd("2026-05-10")).toBe(true);
    });

    it("isValidTimeHm accepts HH:mm in range", () => {
        expect(isValidTimeHm("00:00")).toBe(true);
        expect(isValidTimeHm("23:59")).toBe(true);
        expect(isValidTimeHm("24:00")).toBe(false);
        expect(isValidTimeHm("12:60")).toBe(false);
    });

    it("parseTripCreateDepartureQuery returns null when params missing or invalid", () => {
        expect(parseTripCreateDepartureQuery({})).toBeNull();
        expect(
            parseTripCreateDepartureQuery({
                departureDate: "not-a-date",
            }),
        ).toBeNull();
    });

    it("parseTripCreateDepartureQuery reads departureDate and optional departureTime", () => {
        expect(
            parseTripCreateDepartureQuery({
                departureDate: "2026-05-10",
            }),
        ).toEqual({
            scheduledDepartureDate: "2026-05-10",
            scheduledDepartureTime: "",
        });
        expect(
            parseTripCreateDepartureQuery({
                departureDate: "2026-05-10",
                departureTime: "09:30",
            }),
        ).toEqual({
            scheduledDepartureDate: "2026-05-10",
            scheduledDepartureTime: "09:30",
        });
    });
});

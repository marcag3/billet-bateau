import { describe, expect, it } from "vitest";
import { buildTripUpsertZodSchemaForTests } from "../../models/trips/trips.validation";

describe("Trip upsert zod schema", () => {
    const t = (key: string) => key;
    const schema = buildTripUpsertZodSchemaForTests(t);

    it("accepts valid departure date, time, and capacity", () => {
        const r = schema.safeParse({
            scheduledDepartureDate: "2026-05-10",
            scheduledDepartureTime: "14:30",
            capacity: 12,
            boatTypeId: null,
            waterRouteId: null,
        });
        expect(r.success).toBe(true);
    });

    it("rejects empty departure time", () => {
        const r = schema.safeParse({
            scheduledDepartureDate: "2026-05-10",
            scheduledDepartureTime: "",
            capacity: 2,
            boatTypeId: null,
            waterRouteId: null,
        });
        expect(r.success).toBe(false);
    });

    it("rejects invalid departure time format", () => {
        const r = schema.safeParse({
            scheduledDepartureDate: "2026-05-10",
            scheduledDepartureTime: "9:30",
            capacity: 2,
            boatTypeId: null,
            waterRouteId: null,
        });
        expect(r.success).toBe(false);
    });
});

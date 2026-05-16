import { describe, expect, it } from "vitest";
import { buildTripUpsertZodSchemaForTests } from "../../models/trips/trips.validation";

describe("Trip upsert zod schema", () => {
    const t = (key: string) => key;
    const schema = buildTripUpsertZodSchemaForTests(t);

    it("accepts valid departure date, time, and product", () => {
        const r = schema.safeParse({
            scheduledDepartureDate: "2026-05-10",
            scheduledDepartureTime: "14:30",
            productId: "01HZY7R5TS4QXF58T1TEF0C8WX",
        });
        expect(r.success).toBe(true);
    });

    it("rejects empty departure time", () => {
        const r = schema.safeParse({
            scheduledDepartureDate: "2026-05-10",
            scheduledDepartureTime: "",
            productId: "01HZY7R5TS4QXF58T1TEF0C8WX",
        });
        expect(r.success).toBe(false);
    });

    it("rejects invalid departure time format", () => {
        const r = schema.safeParse({
            scheduledDepartureDate: "2026-05-10",
            scheduledDepartureTime: "9:30",
            productId: "01HZY7R5TS4QXF58T1TEF0C8WX",
        });
        expect(r.success).toBe(false);
    });
});

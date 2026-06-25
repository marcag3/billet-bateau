import { describe, expect, it } from "vitest";
import {
    assignOverlappingIntervalColumnLayout,
    computeCalendarEventHeightPx,
    DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
    normalizeCalendarEventDurationMinutes,
    wallClockHmAfterMinutes,
} from "../../utilities/day-calendar-event-layout";

describe("normalizeCalendarEventDurationMinutes", () => {
    it("returns positive integers unchanged", () => {
        expect(normalizeCalendarEventDurationMinutes(90)).toBe(90);
        expect(normalizeCalendarEventDurationMinutes(1)).toBe(1);
    });

    it("parses numeric strings", () => {
        expect(normalizeCalendarEventDurationMinutes("60")).toBe(60);
        expect(normalizeCalendarEventDurationMinutes("  45  ")).toBe(45);
    });

    it("truncates toward zero for fractional values", () => {
        expect(normalizeCalendarEventDurationMinutes(90.7)).toBe(90);
        expect(normalizeCalendarEventDurationMinutes("120.9")).toBe(120);
    });

    it("uses fallback for null, undefined, or empty string", () => {
        expect(normalizeCalendarEventDurationMinutes(null)).toBe(
            DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
        );
        expect(normalizeCalendarEventDurationMinutes(undefined)).toBe(
            DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
        );
        expect(normalizeCalendarEventDurationMinutes("")).toBe(
            DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
        );
    });

    it("uses fallback for zero, negative, NaN, or non-numeric strings", () => {
        expect(normalizeCalendarEventDurationMinutes(0)).toBe(
            DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
        );
        expect(normalizeCalendarEventDurationMinutes(-5)).toBe(
            DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
        );
        expect(normalizeCalendarEventDurationMinutes(Number.NaN)).toBe(
            DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
        );
        expect(normalizeCalendarEventDurationMinutes("abc")).toBe(
            DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
        );
    });

    it("respects custom fallback minutes", () => {
        expect(normalizeCalendarEventDurationMinutes(null, 15)).toBe(15);
        expect(normalizeCalendarEventDurationMinutes(0, 45)).toBe(45);
    });
});

describe("assignOverlappingIntervalColumnLayout", () => {
    const d = "2026-05-10";

    it("places simultaneous events side-by-side", () => {
        const out = assignOverlappingIntervalColumnLayout([
            { date: d, time: "10:00", durationMinutes: 60, id: "a" },
            { date: d, time: "10:00", durationMinutes: 60, id: "b" },
        ]);
        expect(out.map((e) => e.columnCount)).toEqual([2, 2]);
        expect(new Set(out.map((e) => e.columnIndex))).toEqual(new Set([0, 1]));
    });

    it("does not split adjacent 30-minute slots (half-open intervals)", () => {
        const out = assignOverlappingIntervalColumnLayout([
            { date: d, time: "10:00", durationMinutes: 30, id: "a" },
            { date: d, time: "10:30", durationMinutes: 30, id: "b" },
        ]);
        expect(out.map((e) => [e.columnIndex, e.columnCount])).toEqual([
            [0, 1],
            [0, 1],
        ]);
    });

    it("splits when a longer first slot overlaps a later start time", () => {
        const out = assignOverlappingIntervalColumnLayout([
            { date: d, time: "10:00", durationMinutes: 90, id: "a" },
            { date: d, time: "10:30", durationMinutes: 30, id: "b" },
        ]);
        expect(out.map((e) => e.columnCount)).toEqual([2, 2]);
        expect(new Set(out.map((e) => e.columnIndex))).toEqual(new Set([0, 1]));
    });

    it("uses independent columns for separate non-overlapping clusters", () => {
        const out = assignOverlappingIntervalColumnLayout([
            { date: d, time: "10:00", durationMinutes: 30, id: "a" },
            { date: d, time: "14:00", durationMinutes: 30, id: "b" },
        ]);
        expect(out.map((e) => [e.columnIndex, e.columnCount])).toEqual([
            [0, 1],
            [0, 1],
        ]);
    });

    it("preserves input order", () => {
        const out = assignOverlappingIntervalColumnLayout([
            { date: d, time: "10:00", durationMinutes: 60, id: "first" },
            { date: d, time: "10:00", durationMinutes: 60, id: "second" },
        ]);
        expect(out.map((e) => e.id)).toEqual(["first", "second"]);
    });

    it("uses startMs when provided", () => {
        const t0 = new Date(`${d}T10:00:00`).getTime();
        const t1 = new Date(`${d}T10:30:00`).getTime();
        const out = assignOverlappingIntervalColumnLayout([
            {
                date: d,
                time: "ignored",
                durationMinutes: 90,
                startMs: t0,
                id: "a",
            },
            {
                date: d,
                time: "ignored",
                durationMinutes: 30,
                startMs: t1,
                id: "b",
            },
        ]);
        expect(out.map((e) => e.columnCount)).toEqual([2, 2]);
    });
});

describe("wallClockHmAfterMinutes", () => {
    it("adds minutes within the same day", () => {
        expect(wallClockHmAfterMinutes("10:00", 120)).toBe("12:00");
        expect(wallClockHmAfterMinutes("10:30", 90)).toBe("12:00");
    });
});

describe("computeCalendarEventHeightPx", () => {
    const scope = {
        timeStartPos(time: string): number {
            const [h, m] = time.split(":").map(Number);
            return ((h * 60 + m) / 30) * 22;
        },
        timeDurationHeight(minutes: number): number {
            return (minutes / 30) * 22;
        },
    };

    it("spans two hours as four 30-minute intervals", () => {
        expect(computeCalendarEventHeightPx(scope, "10:00", 120)).toBe(88);
    });

    it("matches timeDurationHeight for one hour", () => {
        expect(computeCalendarEventHeightPx(scope, "10:00", 60)).toBe(44);
    });
});

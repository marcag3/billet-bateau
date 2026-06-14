import { describe, expect, test } from "vitest";
import {
    isProgramsInitialLoadPending,
    shouldShowProgramsEmptyState,
} from "../../utilities/programs-first-run-loading";

describe("programs-first-run-loading", () => {
    test("isProgramsInitialLoadPending is false before bootstrap", () => {
        expect(
            isProgramsInitialLoadPending(false, false, false),
        ).toBe(false);
        expect(
            isProgramsInitialLoadPending(false, true, false),
        ).toBe(false);
    });

    test("isProgramsInitialLoadPending is true when bootstrapped but user_scope sync incomplete", () => {
        expect(
            isProgramsInitialLoadPending(true, false, false),
        ).toBe(true);
    });

    test("isProgramsInitialLoadPending is true when bootstrapped and programs query still loading", () => {
        expect(
            isProgramsInitialLoadPending(true, true, true),
        ).toBe(true);
    });

    test("isProgramsInitialLoadPending is false when bootstrapped, sync complete, and query idle", () => {
        expect(
            isProgramsInitialLoadPending(true, true, false),
        ).toBe(false);
    });

    test("shouldShowProgramsEmptyState is false while initial sync or query loading", () => {
        expect(
            shouldShowProgramsEmptyState(true, 0, false, false),
        ).toBe(false);
        expect(
            shouldShowProgramsEmptyState(true, 0, true, true),
        ).toBe(false);
    });

    test("shouldShowProgramsEmptyState is true only when sync complete, query idle, and filtered list empty", () => {
        expect(
            shouldShowProgramsEmptyState(true, 0, true, false),
        ).toBe(true);
        expect(
            shouldShowProgramsEmptyState(true, 2, true, false),
        ).toBe(false);
    });
});

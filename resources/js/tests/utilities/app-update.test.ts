import { afterEach, describe, expect, it, vi } from "vitest";
import {
    handleLazyChunkLoadError,
    isLazyChunkLoadError,
} from "../../utilities/app-update";

const CHUNK_RELOAD_GUARD_KEY = "app:chunk-reload";

describe("app-update", () => {
    describe("isLazyChunkLoadError", () => {
        it("detects vite dynamic import failures", () => {
            expect(
                isLazyChunkLoadError(
                    new Error(
                        "Failed to fetch dynamically imported module: https://example.test/build/assets/AppBoatsPage-abc123.js",
                    ),
                ),
            ).toBe(true);
        });

        it("detects safari module script failures", () => {
            expect(
                isLazyChunkLoadError(
                    new Error("Importing a module script failed."),
                ),
            ).toBe(true);
        });

        it("detects firefox dynamic import failures", () => {
            expect(
                isLazyChunkLoadError(
                    new Error(
                        "error loading dynamically imported module: https://example.test/build/assets/chunk.js",
                    ),
                ),
            ).toBe(true);
        });

        it("ignores unrelated router errors", () => {
            expect(isLazyChunkLoadError(new Error("Navigation cancelled"))).toBe(
                false,
            );
        });
    });

    describe("handleLazyChunkLoadError", () => {
        afterEach(() => {
            sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY);
            vi.unstubAllGlobals();
        });

        it("reloads once for stale chunk errors", () => {
            const reload = vi.fn();
            vi.stubGlobal("location", { reload });

            expect(
                handleLazyChunkLoadError(
                    new Error("Failed to fetch dynamically imported module"),
                ),
            ).toBe(true);
            expect(reload).toHaveBeenCalledOnce();
            expect(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)).toBe("1");
        });

        it("does not reload again when the guard is already set", () => {
            const reload = vi.fn();
            vi.stubGlobal("location", { reload });
            sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, "1");

            expect(
                handleLazyChunkLoadError(
                    new Error("Failed to fetch dynamically imported module"),
                ),
            ).toBe(true);
            expect(reload).not.toHaveBeenCalled();
        });
    });
});

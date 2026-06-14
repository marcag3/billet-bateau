import { afterEach, describe, expect, it, vi } from "vitest";
import {
    APP_SERVICE_WORKER_SCOPE,
    APP_SERVICE_WORKER_SCRIPT_URL,
    handleLazyChunkLoadError,
    isLazyChunkLoadError,
    registerAppServiceWorker,
    shouldRegisterAppServiceWorker,
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

    describe("shouldRegisterAppServiceWorker", () => {
        afterEach(() => {
            vi.unstubAllGlobals();
            vi.restoreAllMocks();
        });

        it("returns false when a controller is already active", async () => {
            vi.stubGlobal("navigator", {
                serviceWorker: {
                    controller: {},
                    getRegistration: vi.fn().mockResolvedValue(undefined),
                },
            });

            await expect(shouldRegisterAppServiceWorker()).resolves.toBe(false);
        });

        it("returns false when a registration already exists", async () => {
            vi.stubGlobal("navigator", {
                serviceWorker: {
                    controller: null,
                    getRegistration: vi.fn().mockResolvedValue({
                        update: vi.fn(),
                    }),
                },
            });

            await expect(shouldRegisterAppServiceWorker()).resolves.toBe(false);
        });

        it("returns true when no controller or registration exists", async () => {
            vi.stubGlobal("navigator", {
                serviceWorker: {
                    controller: null,
                    getRegistration: vi.fn().mockResolvedValue(undefined),
                },
            });

            await expect(shouldRegisterAppServiceWorker()).resolves.toBe(true);
        });
    });

    describe("registerAppServiceWorker", () => {
        afterEach(() => {
            vi.unstubAllEnvs();
            vi.unstubAllGlobals();
            vi.restoreAllMocks();
        });

        function stubServiceWorkerEnvironment({
            controller = null,
            existingRegistration = undefined,
        }: {
            controller?: object | null;
            existingRegistration?: { update: ReturnType<typeof vi.fn> } | undefined;
        } = {}) {
            const register = vi.fn().mockResolvedValue({
                update: vi.fn(),
            });
            const getRegistration = vi
                .fn()
                .mockResolvedValue(existingRegistration);
            const addEventListener = vi.fn();

            vi.stubGlobal("navigator", {
                serviceWorker: {
                    controller,
                    register,
                    getRegistration,
                    addEventListener,
                    ready: Promise.resolve({ update: vi.fn() }),
                },
            });
            vi.stubGlobal("window", {
                addEventListener: vi.fn(),
            });
            vi.stubGlobal("document", {
                addEventListener: vi.fn(),
            });

            return { register, getRegistration, existingRegistration };
        }

        it("registers the scoped service worker when none exists", async () => {
            vi.stubEnv("PROD", true);

            const { register } = stubServiceWorkerEnvironment();

            registerAppServiceWorker();

            await Promise.resolve();
            await Promise.resolve();

            expect(register).toHaveBeenCalledWith(APP_SERVICE_WORKER_SCRIPT_URL, {
                scope: APP_SERVICE_WORKER_SCOPE,
            });
        });

        it("skips register when a registration already exists", async () => {
            vi.stubEnv("PROD", true);

            const update = vi.fn();
            const { register } = stubServiceWorkerEnvironment({
                existingRegistration: { update },
            });

            registerAppServiceWorker();

            await Promise.resolve();
            await Promise.resolve();

            expect(register).not.toHaveBeenCalled();
            expect(update).toHaveBeenCalled();
        });

        it("skips register when a controller is already active", async () => {
            vi.stubEnv("PROD", true);

            const { register } = stubServiceWorkerEnvironment({
                controller: {},
            });

            registerAppServiceWorker();

            await Promise.resolve();
            await Promise.resolve();

            expect(register).not.toHaveBeenCalled();
        });
    });
});

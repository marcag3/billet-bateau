import { afterEach, describe, expect, it, vi } from "vitest";
import {
    APP_SERVICE_WORKER_SCOPE,
    APP_SERVICE_WORKER_SCRIPT_URL,
} from "../../pwa/constants";
import {
    handleLazyChunkLoadError,
    isLazyChunkLoadError,
} from "../../pwa/stale-chunks";

const CHUNK_RELOAD_GUARD_KEY = "app:chunk-reload";

describe("pwa", () => {
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

        it("does not reload again when escalation already ran", async () => {
            const reload = vi.fn();
            vi.stubGlobal("location", { reload });
            sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, "2");

            expect(
                handleLazyChunkLoadError(
                    new Error("Failed to fetch dynamically imported module"),
                ),
            ).toBe(true);
            expect(reload).not.toHaveBeenCalled();
        });

        it("escalates on second stale chunk error by clearing caches", async () => {
            const reload = vi.fn();
            const deleteCache = vi.fn().mockResolvedValue(true);
            const keys = vi.fn().mockResolvedValue(["app-shell-old", "other"]);
            vi.stubGlobal("location", { reload });
            vi.stubGlobal("caches", { keys, delete: deleteCache });
            vi.stubGlobal("navigator", {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        update: vi.fn().mockResolvedValue(undefined),
                    }),
                },
            });
            sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, "1");

            expect(
                handleLazyChunkLoadError(
                    new Error("Failed to fetch dynamically imported module"),
                ),
            ).toBe(true);

            await vi.waitFor(() => {
                expect(reload).toHaveBeenCalledOnce();
            });

            expect(deleteCache).toHaveBeenCalledWith("app-shell-old");
            expect(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)).toBe("2");
        });
    });

    describe("registerAppServiceWorker", () => {
        afterEach(() => {
            vi.unstubAllEnvs();
            vi.unstubAllGlobals();
            vi.resetModules();
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

        async function loadRegisterModule() {
            vi.stubEnv("PROD", true);
            return import("../../pwa/register");
        }

        it("registers the scoped service worker when none exists", async () => {
            const { register } = stubServiceWorkerEnvironment();
            const { registerAppServiceWorker } = await loadRegisterModule();

            registerAppServiceWorker();

            await vi.waitFor(() => {
                expect(register).toHaveBeenCalledWith(
                    APP_SERVICE_WORKER_SCRIPT_URL,
                    { scope: APP_SERVICE_WORKER_SCOPE },
                );
            });
        });

        it("skips register when a registration already exists", async () => {
            const update = vi.fn();
            const { register } = stubServiceWorkerEnvironment({
                existingRegistration: { update },
            });
            const { registerAppServiceWorker } = await loadRegisterModule();

            registerAppServiceWorker();

            await vi.waitFor(() => {
                expect(update).toHaveBeenCalled();
            });

            expect(register).not.toHaveBeenCalled();
        });

        it("skips register when a controller is already active", async () => {
            const { register } = stubServiceWorkerEnvironment({
                controller: {},
            });
            const { registerAppServiceWorker } = await loadRegisterModule();

            registerAppServiceWorker();

            await Promise.resolve();
            await Promise.resolve();

            expect(register).not.toHaveBeenCalled();
        });
    });
});

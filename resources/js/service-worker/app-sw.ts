// @ts-nocheck — build-time `self` is a service worker; project `lib` is DOM, not webworker
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

const APP_CACHE_VERSION = 'v1';
const APP_SHELL_CACHE = `app-shell-${APP_CACHE_VERSION}`;
const APP_STATIC_CACHE = `app-static-${APP_CACHE_VERSION}`;
const APP_MEDIA_CACHE = `app-media-${APP_CACHE_VERSION}`;
const APP_SHELL_URLS = ['/app', '/app/'];
const STATIC_FILE_PATTERN = /\.(?:css|js|mjs|ico|png|jpe?g|svg|webp|woff2?|ttf)$/i;
const AUTH_PATH_PATTERN = /^\/(?:login|logout|register|password\/?|sanctum\/csrf-cookie)/;
const SERVICE_WORKER_SCRIPT_PATHS = new Set(['/app/sw.js', '/app-sw.js']);

const SW_CONFIG_PATH = '/app/sw-config.json';
const SW_META_CACHE = 'sw-meta-v1';
const SW_CONFIG_CACHE_KEY = SW_CONFIG_PATH;

/** @type {Set<string>} */
let trustedImageOrigins = new Set();
/** @type {Promise<void>} */
let originsReady = loadTrustedOrigins();

/**
 * @param {string[]} origins
 */
function applyTrustedImageOrigins(origins) {
    trustedImageOrigins = new Set(
        origins.map((origin) => String(origin).trim()).filter(Boolean),
    );
}

async function loadTrustedOrigins() {
    const metaCache = await caches.open(SW_META_CACHE);

    try {
        const response = await fetch(SW_CONFIG_PATH, { cache: 'no-store' });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data?.trustedImageOrigins)) {
                applyTrustedImageOrigins(data.trustedImageOrigins);
            }

            await metaCache.put(SW_CONFIG_CACHE_KEY, response.clone());

            return;
        }
    } catch {
        // offline or unreachable — fall back to cached config below
    }

    const cached = await metaCache.match(SW_CONFIG_CACHE_KEY);
    if (cached == null) {
        return;
    }

    try {
        const data = await cached.json();
        if (Array.isArray(data?.trustedImageOrigins)) {
            applyTrustedImageOrigins(data.trustedImageOrigins);
        }
    } catch {
        // ignore invalid cache payload
    }
}

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('message', (event) => {
    const data = event.data;
    if (data?.type === 'SET_TRUSTED_ORIGINS' && Array.isArray(data.trustedImageOrigins)) {
        applyTrustedImageOrigins(data.trustedImageOrigins);
    }
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            originsReady = loadTrustedOrigins();
            await originsReady;

            const shellCache = await caches.open(APP_SHELL_CACHE);
            const staticCache = await caches.open(APP_STATIC_CACHE);

            const shellRequests = APP_SHELL_URLS.map((url) =>
                shellCache.add(new Request(url, { cache: 'reload' })).catch(() => null),
            );

            const staticRequests = ['/build/app.webmanifest', '/icons/app-icon.svg'].map((url) =>
                staticCache.add(url).catch(() => null),
            );

            await Promise.all([...shellRequests, ...staticRequests]);
        })(),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            originsReady = loadTrustedOrigins();
            await originsReady;

            const cacheNames = await caches.keys();
            const keepNames = new Set([APP_SHELL_CACHE, APP_STATIC_CACHE, APP_MEDIA_CACHE, SW_META_CACHE]);

            await Promise.all(
                cacheNames.map((cacheName) => {
                    if (keepNames.has(cacheName) || cacheName.startsWith('workbox-')) {
                        return null;
                    }

                    return caches.delete(cacheName);
                }),
            );

            const staticCache = await caches.open(APP_STATIC_CACHE);
            const cachedRequests = await staticCache.keys();

            await Promise.all(
                cachedRequests.map((request) => {
                    const pathname = new URL(request.url).pathname;

                    if (!SERVICE_WORKER_SCRIPT_PATHS.has(pathname)) {
                        return null;
                    }

                    return staticCache.delete(request);
                }),
            );
        })(),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        if (request.destination === 'image') {
            event.respondWith(
                (async () => {
                    await originsReady;

                    if (!trustedImageOrigins.has(url.origin)) {
                        return fetch(request);
                    }

                    const mediaCache = await caches.open(APP_MEDIA_CACHE);
                    const cached = await mediaCache.match(request);

                    if (cached) {
                        return cached;
                    }

                    const networkResponse = await fetch(request);

                    if (networkResponse.ok) {
                        mediaCache.put(request, networkResponse.clone());
                    }

                    return networkResponse;
                })(),
            );
        }

        return;
    }

    const bypassRuntimeCaching =
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/powersync/') ||
        AUTH_PATH_PATTERN.test(url.pathname) ||
        SERVICE_WORKER_SCRIPT_PATHS.has(url.pathname);

    if (bypassRuntimeCaching) {
        event.respondWith(fetch(request));
        return;
    }

    const isStaticAsset =
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font' ||
        request.destination === 'image' ||
        url.pathname.startsWith('/build/assets/') ||
        STATIC_FILE_PATTERN.test(url.pathname);

    if (isStaticAsset) {
        event.respondWith(
            (async () => {
                const staticCache = await caches.open(APP_STATIC_CACHE);
                const cached = await staticCache.match(request);

                if (cached) {
                    return cached;
                }

                const networkResponse = await fetch(request);

                if (networkResponse.ok) {
                    staticCache.put(request, networkResponse.clone());
                }

                return networkResponse;
            })(),
        );
        return;
    }

    if (request.mode === 'navigate' && url.pathname.startsWith('/app')) {
        event.respondWith(
            (async () => {
                const shellCache = await caches.open(APP_SHELL_CACHE);

                try {
                    const networkResponse = await fetch(request);

                    if (networkResponse.ok) {
                        shellCache.put('/app/', networkResponse.clone());
                    }

                    return networkResponse;
                } catch (error) {
                    const cachedShell = (await shellCache.match('/app/')) || (await shellCache.match('/app'));

                    if (cachedShell) {
                        return cachedShell;
                    }

                    throw error;
                }
            })(),
        );
    }
});

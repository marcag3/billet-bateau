// @ts-nocheck — build-time `self` is a service worker; project `lib` is DOM, not webworker
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const __APP_BUILD_ID__: string;

const BUILD_ID = __APP_BUILD_ID__;
const SHELL_CACHE = `app-shell-${BUILD_ID}`;
const MEDIA_CACHE = `app-media-${BUILD_ID}`;
const META_CACHE = `app-meta-${BUILD_ID}`;

const APP_SHELL_URLS = ['/app', '/app/'];
const OFFLINE_ICON_URLS = ['/icons/app-icon.svg'];
const SW_CONFIG_PATH = '/app/sw-config.json';

const AUTH_PATH_PATTERN = /^\/(?:login|logout|register|password\/?|sanctum\/csrf-cookie)/;
const BYPASS_PATHS = new Set(['/app/sw.js', '/app-sw.js']);

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
    const metaCache = await caches.open(META_CACHE);

    try {
        const response = await fetch(SW_CONFIG_PATH, { cache: 'no-store' });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data?.trustedImageOrigins)) {
                applyTrustedImageOrigins(data.trustedImageOrigins);
            }

            await metaCache.put(SW_CONFIG_PATH, response.clone());

            return;
        }
    } catch {
        // offline — fall back to cached config below
    }

    const cached = await metaCache.match(SW_CONFIG_PATH);
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

/**
 * @param {string[]} cacheNames
 */
async function deleteStaleCaches(cacheNames) {
    const keep = new Set([SHELL_CACHE, MEDIA_CACHE, META_CACHE]);

    await Promise.all(
        cacheNames.map((name) => {
            if (name.startsWith('workbox-') || keep.has(name)) {
                return null;
            }

            if (name.startsWith('app-') || name === 'sw-meta-v1') {
                return caches.delete(name);
            }

            return null;
        }),
    );
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

            const shellCache = await caches.open(SHELL_CACHE);

            await Promise.all([
                ...APP_SHELL_URLS.map((url) =>
                    shellCache.add(new Request(url, { cache: 'reload' })).catch(() => null),
                ),
                ...OFFLINE_ICON_URLS.map((url) =>
                    shellCache.add(url).catch(() => null),
                ),
            ]);
        })(),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            originsReady = loadTrustedOrigins();
            await originsReady;
            await deleteStaleCaches(await caches.keys());
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
        if (request.destination !== 'image') {
            return;
        }

        event.respondWith(
            (async () => {
                await originsReady;

                if (!trustedImageOrigins.has(url.origin)) {
                    return fetch(request);
                }

                const mediaCache = await caches.open(MEDIA_CACHE);
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

        return;
    }

    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/powersync/') ||
        AUTH_PATH_PATTERN.test(url.pathname) ||
        BYPASS_PATHS.has(url.pathname) ||
        url.pathname.startsWith('/build/')
    ) {
        return;
    }

    if (request.mode === 'navigate' && url.pathname.startsWith('/app')) {
        event.respondWith(
            (async () => {
                const shellCache = await caches.open(SHELL_CACHE);

                try {
                    const networkResponse = await fetch(request, { cache: 'no-store' });

                    if (networkResponse.ok) {
                        shellCache.put('/app/', networkResponse.clone());
                    }

                    return networkResponse;
                } catch {
                    return (
                        (await shellCache.match('/app/')) ||
                        (await shellCache.match('/app')) ||
                        fetch(request)
                    );
                }
            })(),
        );
    }
});

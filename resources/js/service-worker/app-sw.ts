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

declare const __OBJECT_STORAGE_ORIGINS__: string[];

const trustedImageOrigins = new Set(
    typeof __OBJECT_STORAGE_ORIGINS__ !== 'undefined'
        ? __OBJECT_STORAGE_ORIGINS__
        : ['http://localhost:9000'],
);

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
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
            const cacheNames = await caches.keys();
            const keepNames = new Set([APP_SHELL_CACHE, APP_STATIC_CACHE, APP_MEDIA_CACHE]);

            await Promise.all(
                cacheNames.map((cacheName) => {
                    if (keepNames.has(cacheName) || cacheName.startsWith('workbox-')) {
                        return null;
                    }

                    return caches.delete(cacheName);
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
        if (
            request.destination === 'image' &&
            trustedImageOrigins.has(url.origin)
        ) {
            event.respondWith(
                (async () => {
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
        AUTH_PATH_PATTERN.test(url.pathname);

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

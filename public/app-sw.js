const APP_CACHE_VERSION = 'v1';
const APP_SHELL_CACHE = `app-shell-${APP_CACHE_VERSION}`;
const APP_STATIC_CACHE = `app-static-${APP_CACHE_VERSION}`;
const APP_SHELL_URLS = ['/app', '/app/'];
const STATIC_FILE_PATTERN = /\.(?:css|js|mjs|ico|png|jpe?g|svg|webp|woff2?|ttf)$/i;
const AUTH_PATH_PATTERN = /^\/(?:login|logout|register|password\/?|sanctum\/csrf-cookie)/;

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            self.skipWaiting();

            const shellCache = await caches.open(APP_SHELL_CACHE);
            const staticCache = await caches.open(APP_STATIC_CACHE);

            const shellRequests = APP_SHELL_URLS.map((url) =>
                shellCache.add(new Request(url, { cache: 'reload' })).catch(() => null),
            );

            const staticRequests = ['/app.webmanifest', '/icons/app-icon.svg']
                .map((url) => staticCache.add(url).catch(() => null));

            const viteManifestResponse = await fetch('/build/manifest.json').catch(() => null);

            if (viteManifestResponse?.ok) {
                const viteManifest = await viteManifestResponse.json().catch(() => null);

                if (viteManifest && typeof viteManifest === 'object') {
                    const assets = new Set();

                    for (const entry of Object.values(viteManifest)) {
                        if (!entry || typeof entry !== 'object') {
                            continue;
                        }

                        if (typeof entry.file === 'string') {
                            assets.add(`/build/${entry.file}`);
                        }

                        if (Array.isArray(entry.css)) {
                            for (const cssFile of entry.css) {
                                assets.add(`/build/${cssFile}`);
                            }
                        }

                        if (Array.isArray(entry.assets)) {
                            for (const assetFile of entry.assets) {
                                assets.add(`/build/${assetFile}`);
                            }
                        }
                    }

                    for (const assetUrl of assets) {
                        staticRequests.push(staticCache.add(assetUrl).catch(() => null));
                    }
                }
            }

            await Promise.all([...shellRequests, ...staticRequests]);
        })(),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            const keepNames = new Set([APP_SHELL_CACHE, APP_STATIC_CACHE]);

            await Promise.all(
                cacheNames.map((cacheName) => (keepNames.has(cacheName) ? null : caches.delete(cacheName))),
            );

            await self.clients.claim();
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
        return;
    }

    const bypassRuntimeCaching =
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/electric/') ||
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
                    const cachedShell = await shellCache.match('/app/') || await shellCache.match('/app');

                    if (cachedShell) {
                        return cachedShell;
                    }

                    throw error;
                }
            })(),
        );
    }
});

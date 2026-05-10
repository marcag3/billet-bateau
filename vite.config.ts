import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const wayfinderDisabled = process.env.VITEST === 'true' || process.env.DISABLE_WAYFINDER === 'true';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isVitest = mode === 'test' || process.env.VITEST === 'true';
    const objectStorageOrigins = (
        env.VITE_OBJECT_STORAGE_ORIGINS
        ?? env.VITE_MEDIA_PUBLIC_BASE_URL
        ?? 'http://localhost:9000'
    )
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    return {
        resolve: {
            alias: isVitest
                ? {
                      leaflet: path.resolve(projectDir, 'resources/js/tests/mocks/leaflet.ts'),
                  }
                : {},
        },
        // PowerSync / WA-SQLite ship web workers + WASM; pre-bundling them breaks `db.init()` in dev (hangs forever).
        // https://github.com/vitejs/vite/issues/11672#issuecomment-1415820673
        // https://github.com/powersync-ja/powersync-js/blob/main/demos/example-vite/vite.config.ts
        optimizeDeps: {
            exclude: ['@powersync/web', '@journeyapps/wa-sqlite'],
        },
        plugins: [
            ...(wayfinderDisabled
                ? []
                : [
                      wayfinder(),
                  ]),
            laravel({
                input: ['resources/js/public.main.ts', 'resources/js/app.main.ts'],
                refresh: true,
            }),
            vue({
                template: { transformAssetUrls },
            }),
            quasar(),
            VitePWA({
                strategies: 'injectManifest',
                srcDir: 'resources/js/service-worker',
                filename: 'app-sw.js',
                injectRegister: false,
                registerType: 'autoUpdate',
                manifestFilename: 'app.webmanifest',
                manifest: {
                    id: '/app/',
                    name: 'Billet Bateau App',
                    short_name: 'Billet',
                    description: 'Billet Bateau application shell',
                    start_url: '/app/',
                    scope: '/app/',
                    display: 'standalone',
                    background_color: '#02153D',
                    theme_color: '#02153D',
                    icons: [
                        {
                            src: '/icons/app-icon.svg',
                            sizes: 'any',
                            type: 'image/svg+xml',
                            purpose: 'any maskable',
                        },
                    ],
                },
                injectManifest: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,ttf,json,wasm}'],
                    // PowerSync / wa-sqlite ships multi-megabyte WASM bundles for the sync worker.
                    maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                },
            }),
        ],
        define: {
            __OBJECT_STORAGE_ORIGINS__: JSON.stringify(objectStorageOrigins),
        },
        worker: {
            format: 'es',
        },
        server: {
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
        test: {
            // enable jest-like global test APIs
            globals: true,
            // simulate DOM with happy-dom
            // (requires installing happy-dom as a peer dependency)
            environment: 'happy-dom',
            env: {
                VITE_MEDIA_PUBLIC_BASE_URL: 'http://localhost:9000/app',
            },
        },
    };
});

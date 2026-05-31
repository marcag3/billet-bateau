import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite'

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const wayfinderDisabled = process.env.VITEST === 'true' || process.env.DISABLE_WAYFINDER === 'true';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isVitest = mode === 'test' || process.env.VITEST === 'true';
    const objectStorageOrigins = (
        env.VITE_OBJECT_STORAGE_ORIGINS
        ?? env.VITE_MEDIA_PUBLIC_BASE_URL
        ?? env.AWS_URL
        ?? 'http://localhost:9000'
    )
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const sentryUploadEnabled = env.SENTRY_UPLOAD === 'true'
        && Boolean(env.SENTRY_AUTH_TOKEN)
        && Boolean(env.SENTRY_ORG)
        && Boolean(env.SENTRY_PROJECT);

    return {
        build: {
            sourcemap: sentryUploadEnabled ? 'hidden' : false,
        },
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
            tailwindcss(),
            ...(wayfinderDisabled
                ? []
                : [
                      wayfinder(),
                  ]),
            // laravel-vite-plugin deletes public/hot on process exit; skip during Vitest so
            // `npm run test` does not remove the hot file while `npm run dev` is running.
            ...(isVitest
                ? []
                : [
                      laravel({
                          input: ['resources/js/public.main.ts', 'resources/js/app.main.ts'],
                          refresh: true,
                      }),
                  ]),
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
            ...(sentryUploadEnabled
                ? [
                      sentryVitePlugin({
                          org: env.SENTRY_ORG,
                          project: env.SENTRY_PROJECT,
                          authToken: env.SENTRY_AUTH_TOKEN,
                          release: {
                              name: env.VITE_SENTRY_RELEASE,
                          },
                          sourcemaps: {
                              assets: './public/build/**',
                              filesToDeleteAfterUpload: ['./public/build/**/*.map'],
                          },
                      }),
                  ]
                : []),
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

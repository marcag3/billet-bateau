import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        wayfinder(),
        laravel({
            input: ['resources/js/entries/public.main.js', 'resources/js/entries/app.main.js'],
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
                background_color: '#020617',
                theme_color: '#0f172a',
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
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,ttf,json}'],
            },
        }),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});

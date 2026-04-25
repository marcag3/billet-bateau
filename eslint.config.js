import eslint from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
    {
        ignores: ['vendor/**', 'public/build/**', 'node_modules/**'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        files: ['resources/js/**/*.{ts,vue}'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: ['.vue'],
            },
            ecmaVersion: 2022,
            sourceType: 'module',
        },
    },
    {
        files: ['resources/js/**/*.ts', 'resources/js/**/*.vue'],
        languageOptions: {
            globals: { ...globals.browser },
        },
    },
    {
        files: ['resources/js/service-worker/app-sw.ts'],
        rules: {
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
);

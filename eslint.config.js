import eslint from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
    {
        ignores: ['vendor/**', 'public/build/**', 'node_modules/**'],
    },
    eslint.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        files: ['resources/js/**/*.js', 'resources/js/**/*.vue'],
        languageOptions: {
            globals: { ...globals.browser },
            ecmaVersion: 2022,
            sourceType: 'module',
        },
    },
];

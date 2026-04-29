import { createI18n } from 'vue-i18n';

import en from './locales/en';
import fr from './locales/fr';

export const LOCALE_STORAGE_KEY = 'app.locale';
export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'en';

const messages = {
    en,
    fr,
};

function normalizeLocale(value: unknown): AppLocale {
    if (typeof value !== 'string' || value.length === 0) {
        return DEFAULT_LOCALE;
    }

    const baseLocale = value.toLowerCase().split('-')[0];

    if (baseLocale === 'en' || baseLocale === 'fr') {
        return baseLocale;
    }

    return DEFAULT_LOCALE;
}

function resolveInitialLocale() {
    if (typeof window === 'undefined') {
        return DEFAULT_LOCALE;
    }

    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    if (storedLocale) {
        return normalizeLocale(storedLocale);
    }

    return normalizeLocale(window.navigator.language);
}

export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: resolveInitialLocale(),
    fallbackLocale: DEFAULT_LOCALE,
    messages,
});

export function setLocale(locale: unknown) {
    const nextLocale = normalizeLocale(locale);
    i18n.global.locale.value = nextLocale;

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
}

export function translate(key: string, values: Record<string, unknown> = {}) {
    return i18n.global.t(key, values);
}

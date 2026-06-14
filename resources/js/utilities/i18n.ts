import { createI18n } from 'vue-i18n';
import { Quasar, type QuasarLanguage } from 'quasar';

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

const quasarLangLoaders: Record<AppLocale, () => Promise<{ default: QuasarLanguage }>> = {
    en: () => import('quasar/lang/en-US'),
    fr: () => import('quasar/lang/fr'),
};

/**
 * Align Quasar component strings (date picker, table, etc.) with the active vue-i18n locale.
 */
export async function applyQuasarLanguagePack(locale: AppLocale): Promise<void> {
    try {
        const mod = await quasarLangLoaders[locale]();
        Quasar.lang.set(mod.default);
    } catch {
        console.warn(`Quasar language pack could not be applied for locale: ${locale}`);
    }
}

/** Call after `app.use(Quasar)` and `app.use(i18n)` so the UI matches stored or browser locale. */
export async function syncQuasarLanguageWithI18n(): Promise<void> {
    await applyQuasarLanguagePack(normalizeLocale(i18n.global.locale.value));
}

export function setLocale(locale: unknown) {
    const nextLocale = normalizeLocale(locale);
    i18n.global.locale.value = nextLocale;

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }

    void applyQuasarLanguagePack(nextLocale);
}

export function translate(key: string, values: Record<string, unknown> = {}) {
    return i18n.global.t(key, values);
}

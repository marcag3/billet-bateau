export type AppMediaConfig = {
    publicBaseUrl: string;
    trustedImageOrigins: string[];
};

export const APP_MEDIA_CONFIG_META_NAME = 'app-media-config';
export const APP_SW_CONFIG_URL = '/app/sw-config.json';

let cachedConfig: AppMediaConfig | null = null;

function normalizeBaseUrl(value: string): string {
    return value.trim().replace(/\/+$/, '');
}

function parseAppMediaConfig(raw: unknown): AppMediaConfig | null {
    if (raw == null || typeof raw !== 'object') {
        return null;
    }

    const record = raw as Record<string, unknown>;
    const publicBaseUrl =
        typeof record.publicBaseUrl === 'string' ? normalizeBaseUrl(record.publicBaseUrl) : '';
    const trustedImageOrigins = Array.isArray(record.trustedImageOrigins)
        ? record.trustedImageOrigins
              .map((origin) => (typeof origin === 'string' ? origin.trim() : ''))
              .filter((origin) => origin.length > 0)
        : [];

    return { publicBaseUrl, trustedImageOrigins };
}

function vitestFallbackConfig(): AppMediaConfig | null {
    if (import.meta.env.MODE !== 'test' && !import.meta.env.VITEST) {
        return null;
    }

    const base = import.meta.env.VITE_MEDIA_PUBLIC_BASE_URL;
    if (typeof base !== 'string' || base.trim() === '') {
        return null;
    }

    const publicBaseUrl = normalizeBaseUrl(base);
    let trustedImageOrigins: string[] = [];

    try {
        const origin = new URL(publicBaseUrl).origin;
        if (origin.length > 0) {
            trustedImageOrigins = [origin];
        }
    } catch {
        trustedImageOrigins = [];
    }

    return { publicBaseUrl, trustedImageOrigins };
}

export function readAppMediaConfigFromMeta(): AppMediaConfig | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const element = document.querySelector(`meta[name="${APP_MEDIA_CONFIG_META_NAME}"]`);
    const content = element?.getAttribute('content');
    if (content == null || content.trim() === '') {
        return null;
    }

    try {
        return parseAppMediaConfig(JSON.parse(content));
    } catch {
        return null;
    }
}

export function getAppMediaConfig(): AppMediaConfig | null {
    if (cachedConfig != null) {
        return cachedConfig;
    }

    cachedConfig =
        readAppMediaConfigFromMeta() ?? vitestFallbackConfig();

    return cachedConfig;
}

export function setAppMediaConfig(config: AppMediaConfig): void {
    cachedConfig = config;
}

export function resetAppMediaConfig(): void {
    cachedConfig = null;
}

export function mediaPublicBaseUrl(): string {
    return getAppMediaConfig()?.publicBaseUrl ?? '';
}

export function trustedImageOrigins(): string[] {
    return getAppMediaConfig()?.trustedImageOrigins ?? [];
}

export async function refreshAppMediaConfigFromNetwork(): Promise<AppMediaConfig | null> {
    try {
        const response = await fetch(APP_SW_CONFIG_URL, { cache: 'no-store' });
        if (!response.ok) {
            return getAppMediaConfig();
        }

        const config = parseAppMediaConfig(await response.json());
        if (config != null) {
            setAppMediaConfig(config);
        }

        return config;
    } catch {
        return getAppMediaConfig();
    }
}

export function notifyServiceWorkerOfMediaConfig(): void {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const origins = trustedImageOrigins();
    if (origins.length === 0) {
        return;
    }

    const message = {
        type: 'SET_TRUSTED_ORIGINS',
        trustedImageOrigins: origins,
    };

    navigator.serviceWorker.controller?.postMessage(message);

    void navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage(message);
    });
}

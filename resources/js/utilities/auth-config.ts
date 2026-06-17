export type AppAuthConfig = {
    google_oauth_enabled: boolean;
};

export const APP_AUTH_CONFIG_META_NAME = 'app-auth-config';

let cachedConfig: AppAuthConfig | null = null;

function parseAppAuthConfig(raw: unknown): AppAuthConfig | null {
    if (raw == null || typeof raw !== 'object') {
        return null;
    }

    const record = raw as Record<string, unknown>;

    return {
        google_oauth_enabled: record.google_oauth_enabled === true,
    };
}

export function readAppAuthConfigFromMeta(): AppAuthConfig | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const element = document.querySelector(`meta[name="${APP_AUTH_CONFIG_META_NAME}"]`);
    const content = element?.getAttribute('content');
    if (content == null || content.trim() === '') {
        return null;
    }

    try {
        return parseAppAuthConfig(JSON.parse(content));
    } catch {
        return null;
    }
}

export function getAppAuthConfig(): AppAuthConfig {
    if (cachedConfig != null) {
        return cachedConfig;
    }

    cachedConfig = readAppAuthConfigFromMeta() ?? { google_oauth_enabled: false };

    return cachedConfig;
}

export function resetAppAuthConfig(): void {
    cachedConfig = null;
}

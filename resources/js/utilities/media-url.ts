declare const __OBJECT_STORAGE_ORIGINS__: string[];

/**
 * Browser-facing base URL for public object keys (aligned with {@see config('media.public_base_url')}).
 */
function mediaPublicBaseUrl(): string {
    const explicit = import.meta.env.VITE_MEDIA_PUBLIC_BASE_URL;
    if (typeof explicit === 'string' && explicit.trim() !== '') {
        return explicit.replace(/\/+$/, '');
    }

    if (
        typeof __OBJECT_STORAGE_ORIGINS__ !== 'undefined'
        && Array.isArray(__OBJECT_STORAGE_ORIGINS__)
        && __OBJECT_STORAGE_ORIGINS__.length > 0
    ) {
        return String(__OBJECT_STORAGE_ORIGINS__[0] ?? '').replace(/\/+$/, '');
    }

    return '';
}

/**
 * Public URL for an object storage key (no SDK), matching server {@see Program::mediaUrlFromKey}.
 */
export function mediaObjectPublicUrl(objectKey: string | null | undefined): string {
    if (objectKey == null) {
        return '';
    }

    const key = String(objectKey).trim();
    if (key.length === 0) {
        return '';
    }

    const base = mediaPublicBaseUrl();
    if (base.length === 0) {
        return '';
    }

    return `${base}/${key.replace(/^\/+/, '')}`;
}

import { mediaPublicBaseUrl } from './media-config';

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

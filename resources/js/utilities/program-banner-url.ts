import { mediaObjectPublicUrl } from './media-url';

/** Static placeholder when a program has no banner image. */
export const PROGRAM_BANNER_FALLBACK_URL = '/images/program-fallback.svg';

export function programBannerUrlFromObjectKey(
    objectKey: string | null | undefined,
): string {
    const url = mediaObjectPublicUrl(objectKey);
    if (url.length > 0) {
        return url;
    }

    return PROGRAM_BANNER_FALLBACK_URL;
}

export function programBannerUrlFromUrl(url: string | null | undefined): string {
    const trimmed = url != null ? String(url).trim() : '';
    if (trimmed.length > 0) {
        return trimmed;
    }

    return PROGRAM_BANNER_FALLBACK_URL;
}

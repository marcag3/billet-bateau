import { requestJson } from '../services/http.client';

type PresignResponse = {
    url: string;
    headers: Record<string, string>;
    object_key: string;
    object_url?: string;
};

export type ImageDirectUploadResult = {
    /** Public URL from presign `object_url` (aligned with server `Program::mediaUrlFromKey`). */
    publicUrl: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    etag: string | null;
};

function normalizeMimeType(file: File): string {
    const raw = String(file.type ?? '').trim();
    if (raw.length > 0) {
        return raw;
    }

    const name = file.name.toLowerCase();
    if (name.endsWith('.png')) {
        return 'image/png';
    }
    if (name.endsWith('.webp')) {
        return 'image/webp';
    }

    return 'image/jpeg';
}

/**
 * Presign → PUT to object storage (no finalize).
 */
export async function uploadImageViaPresignedPut(
    file: File,
    presignUrl: string,
): Promise<ImageDirectUploadResult> {
    const mimeType = normalizeMimeType(file);

    const presignPayload = await requestJson(presignUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mime_type: mimeType }),
        withCsrf: true,
    });

    const envelope = presignPayload as { data?: unknown };
    const data = envelope.data as PresignResponse | undefined;
    if (data == null || typeof data.url !== 'string' || typeof data.object_key !== 'string') {
        throw new Error('Invalid presign response.');
    }

    const putHeaders = new Headers();
    const signed = data.headers ?? {};
    for (const [key, value] of Object.entries(signed)) {
        if (typeof value === 'string' && value.length > 0) {
            putHeaders.set(key, value);
        }
    }

    const putResponse = await fetch(data.url, {
        method: 'PUT',
        headers: putHeaders,
        body: file,
    });

    if (!putResponse.ok) {
        throw new Error(`Direct upload failed with status ${String(putResponse.status)}.`);
    }

    const etag = putResponse.headers.get('etag');

    const publicUrl =
        typeof data.object_url === 'string' && data.object_url.length > 0 ? data.object_url : '';

    return {
        publicUrl,
        objectKey: data.object_key,
        mimeType,
        sizeBytes: file.size,
        etag,
    };
}

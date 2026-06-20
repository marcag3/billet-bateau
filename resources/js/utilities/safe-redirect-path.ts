export function sanitizeRedirectPath(
    path: string | null | undefined,
    defaultPath = '/',
): string {
    if (path === null || path === undefined) {
        return defaultPath;
    }

    const trimmed = path.trim();
    if (trimmed.length === 0) {
        return defaultPath;
    }

    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
        return defaultPath;
    }

    if (trimmed.includes('\\') || trimmed.includes('\0')) {
        return defaultPath;
    }

    return trimmed;
}

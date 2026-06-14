/**
 * Returns true when the file MIME type matches a comma-separated accept list.
 */
export function fileMatchesAccept(file: File, accept: string): boolean {
    const tokens = accept
        .split(',')
        .map((token) => token.trim())
        .filter((token) => token.length > 0);

    if (tokens.length === 0) {
        return true;
    }

    const fileType = file.type.trim().toLowerCase();
    const fileName = file.name.toLowerCase();

    return tokens.some((token) => {
        const normalized = token.toLowerCase();

        if (normalized.endsWith('/*')) {
            const prefix = normalized.slice(0, -1);
            return fileType.startsWith(prefix);
        }

        if (normalized.startsWith('.')) {
            return fileName.endsWith(normalized);
        }

        return fileType === normalized;
    });
}

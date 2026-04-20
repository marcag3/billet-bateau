export function isRecoverableNetworkError(error) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return true;
    }

    if (error instanceof TypeError) {
        return true;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';

    return message.includes('networkerror') || message.includes('failed to fetch');
}

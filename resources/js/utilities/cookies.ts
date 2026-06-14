export function readCookieValue(name) {
    if (typeof document === 'undefined') {
        return '';
    }

    const cookiePrefix = `${name}=`;
    const matchedCookie = document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(cookiePrefix));

    if (!matchedCookie) {
        return '';
    }

    return decodeURIComponent(matchedCookie.slice(cookiePrefix.length));
}

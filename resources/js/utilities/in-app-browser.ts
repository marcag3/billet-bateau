const META_IN_APP_BROWSER_PATTERN = /FBAN|FBAV|FB_IAB|MetaIAB|Instagram/i;
const IOS_PATTERN = /iPhone|iPad|iPod/i;
const ANDROID_PATTERN = /Android/i;

export const META_IN_APP_BROWSER_BANNER_DISMISS_KEY =
    "meta-in-app-browser-banner-dismissed";

export type RecommendedBrowser = "Firefox" | "Safari" | "browser";

const FIREFOX_ANDROID_PACKAGE = "org.mozilla.firefox";

/**
 * Whether the user agent indicates Facebook or Instagram in-app browser.
 */
export function isMetaInAppBrowser(
    userAgent: string = navigator.userAgent,
): boolean {
    return META_IN_APP_BROWSER_PATTERN.test(userAgent);
}

export function isIos(userAgent: string = navigator.userAgent): boolean {
    return IOS_PATTERN.test(userAgent);
}

export function isAndroid(userAgent: string = navigator.userAgent): boolean {
    return ANDROID_PATTERN.test(userAgent);
}

export function recommendedBrowser(
    userAgent: string = navigator.userAgent,
): RecommendedBrowser {
    if (isIos(userAgent) || isAndroid(userAgent)) {
        return "Firefox";
    }

    return "browser";
}

/**
 * URL scheme tricks that sometimes escape Meta in-app browsers into Firefox.
 */
export function buildExternalBrowserOpenUrl(
    url: string,
    userAgent: string = navigator.userAgent,
): string | null {
    try {
        const parsed = new URL(url);

        if (isIos(userAgent)) {
            return `firefox://open-url?url=${encodeURIComponent(parsed.href)}`;
        }

        if (isAndroid(userAgent)) {
            return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=https;package=${FIREFOX_ANDROID_PACKAGE};end`;
        }
    } catch {
        return null;
    }

    return null;
}

export function shouldShowMetaInAppBrowserBanner(
    userAgent: string = navigator.userAgent,
    dismissed: boolean = sessionStorage.getItem(
        META_IN_APP_BROWSER_BANNER_DISMISS_KEY,
    ) === "1",
): boolean {
    return isMetaInAppBrowser(userAgent) && !dismissed;
}

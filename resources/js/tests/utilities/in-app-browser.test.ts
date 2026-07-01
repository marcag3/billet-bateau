import { describe, expect, it } from "vitest";
import {
    buildExternalBrowserOpenUrl,
    isMetaInAppBrowser,
    recommendedBrowser,
    shouldShowMetaInAppBrowserBanner,
} from "../../utilities/in-app-browser";

const facebookIosUa =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/567.0.0;FBBV/123;FBDV/iPhone14,7;]";
const safariIosUa =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const facebookAndroidUa =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/567.0.0;]";

describe("isMetaInAppBrowser", () => {
    it("detects Facebook in-app browser on iOS", () => {
        expect(isMetaInAppBrowser(facebookIosUa)).toBe(true);
    });

    it("detects Facebook in-app browser on Android", () => {
        expect(isMetaInAppBrowser(facebookAndroidUa)).toBe(true);
    });

    it("does not flag Safari", () => {
        expect(isMetaInAppBrowser(safariIosUa)).toBe(false);
    });
});

describe("recommendedBrowser", () => {
    it("recommends Firefox on iOS", () => {
        expect(recommendedBrowser(facebookIosUa)).toBe("Firefox");
    });

    it("recommends Firefox on Android", () => {
        expect(recommendedBrowser(facebookAndroidUa)).toBe("Firefox");
    });
});

describe("buildExternalBrowserOpenUrl", () => {
    it("builds Firefox open-url deeplink on iOS", () => {
        expect(
            buildExternalBrowserOpenUrl(
                "https://billet.example/programs/test?fbclid=abc",
                facebookIosUa,
            ),
        ).toBe(
            "firefox://open-url?url=https%3A%2F%2Fbillet.example%2Fprograms%2Ftest%3Ffbclid%3Dabc",
        );
    });

    it("builds Firefox intent URL on Android", () => {
        expect(
            buildExternalBrowserOpenUrl(
                "https://billet.example/?fbclid=abc",
                facebookAndroidUa,
            ),
        ).toBe(
            "intent://billet.example/?fbclid=abc#Intent;scheme=https;package=org.mozilla.firefox;end",
        );
    });
});

describe("shouldShowMetaInAppBrowserBanner", () => {
    it("shows for Meta in-app browser when not dismissed", () => {
        expect(
            shouldShowMetaInAppBrowserBanner(facebookIosUa, false),
        ).toBe(true);
    });

    it("hides when dismissed", () => {
        expect(shouldShowMetaInAppBrowserBanner(facebookIosUa, true)).toBe(
            false,
        );
    });

    it("hides in regular Safari", () => {
        expect(shouldShowMetaInAppBrowserBanner(safariIosUa, false)).toBe(
            false,
        );
    });
});

import { boot } from "quasar/wrappers";
import { createI18n } from "vue-i18n";
import messages from "src/i18n";
import { Quasar, Cookies } from "quasar";
import config from "../config.json";
import fr from "dayjs/locale/fr-ca";
import en from "dayjs/locale/en-ca";

let langIso = Cookies.get("language_preference");
const availableLang = ["fr", "en-CA"];

if (!availableLang.includes(langIso)) {
    langIso = availableLang[0];
    if (Quasar.lang.getLocale().match(/en/)) {
        langIso = "en-US";
    }
}

Cookies.set("language_preference", langIso, config.cookiesOptions);

const i18n = createI18n({
    legacy: false,
    locale: langIso,
    fallbackLocale: "fr",
    messages,
});

export default boot(async ({ app }) => {
    try {
        await import(
            /* webpackInclude: /(fr|en-US)\.js$/ */
            "quasar/lang/" + langIso
        ).then((lang) => {
            Quasar.lang.set(lang.default);
        });
    } catch (err) {
        console.log("language not found");
        // Requested Quasar Language Pack does not exist,
        // let's not break the app, so catching error
    }

    // Set i18n instance on app
    app.use(i18n);
});

export { i18n };

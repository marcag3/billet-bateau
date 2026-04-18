import { boot } from "quasar/wrappers";
import duration from "dayjs/plugin/duration";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Quasar, Cookies } from "quasar";

let lang = Cookies.get("language_preference");
const availableLang = ["fr", "en-CA"];

if (!availableLang.includes(lang)) {
    lang = availableLang[0];
    if (Quasar.lang.getLocale().match(/en/)) {
        lang = availableLang[1];
    }
}
if (lang === availableLang[0]) lang = "fr-ca";
else lang = "en-ca";

export default boot(async () => {
    dayjs.extend(duration);
    dayjs.extend(relativeTime);
    try {
        await import(
            /* webpackInclude: /(fr-ca|en-ca)\.js$/ */
            "dayjs/locale/" + lang
        ).then((lang) => {
            dayjs.locale(lang);
        });
    } catch (err) {
        console.log("dayjs language not found");
        // Requested Quasar Language Pack does not exist,
        // let's not break the app, so catching error
    }
});

export { dayjs };

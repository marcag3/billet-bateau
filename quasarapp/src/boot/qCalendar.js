import { boot } from "quasar/wrappers";
import Plugin from "@quasar/quasar-ui-qcalendar/src/QCalendarDay.js";
import "@quasar/quasar-ui-qcalendar/src/css/calendar-day.sass";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app }) => {
    app.use(Plugin);
});

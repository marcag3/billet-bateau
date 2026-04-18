import { i18n } from "boot/i18n";
import { date, Notify } from "quasar";
import { parseTime } from "@quasar/quasar-ui-qcalendar";
import { isTime } from "./validators";

const { t } = i18n.global;

export function alertError(error) {
    //@TODO: remove for production
    let txtMessage = "";

    if (error.response && error.response.data && error.response.data.message) {
        txtMessage =
            t("error") +
            " : " +
            error.response.data.message +
            "<br />file: " +
            error.response.data.file +
            "<br />line: " +
            error.response.data.line;
    } else {
        txtMessage = t("error") + " : " + error.message;
    }
    Notify.create({
        closeBtn: true,
        timeout: 0,
        color: "negative",
        icon: "error",
        multiLine: true,
        html: true,
        message: txtMessage,
    });
}

export function normalize(value) {
    if (typeof value === "string") return value.toLowerCase();
    return value;
}

export function alertSuccess(message) {
    Notify.create({
        color: "positive",
        icon: "cloud_done",
        message: t(message),
    });
}

export function timeToDate(time) {
    if (Date.parse(time)) {
        return time;
    } else {
        return date.extractDate("1970-01-01 " + time, "YYYY-MM-DD HH:mm");
    }
}

export function dateToTimeString(dateVar) {
    return date.formatDate(dateVar, "HH:mm");
}

export function dateToDateString(dateVar) {
    // if (typeof dateVar === "string" || dateVar instanceof String) return dateVar;
    return date.formatDate(dateVar, "YYYY-MM-DD");
}
export function dateToDateTimeString(dateVar) {
    // if (typeof dateVar === "string" || dateVar instanceof String) return dateVar;
    return date.formatDate(dateVar, "YYYY-MM-DD HH:mm");
}
export function adjustTime(dateVar, time) {
    if (!time || !isTime.$validator(time)) return;
    const timeArray = time.split(":");
    return dateToDateTimeString(date.adjustDate(dateVar, { hours: timeArray[0], minutes: timeArray[1] }));
}
export function nextDeparture() {
    let departure = date.addToDate(new Date(), { minutes: 3 });
    let toAdd = 15 - (departure.getMinutes() % 15);
    departure = date.addToDate(departure, { minutes: toAdd });
    return dateToDateTimeString(departure);
}

export function eventIsConcurent(otherEvent, event) {
    const otherStartTime = parseTime(otherEvent.time);
    const otherEndTime = otherStartTime + otherEvent.duration - 1;
    const eventStart = parseTime(event.time);
    const eventEnd = eventStart + event.duration;

    return (
        (eventStart >= otherStartTime && eventStart < otherEndTime) ||
        (eventStart <= otherStartTime && eventEnd > otherStartTime)
    );
}

export function assignEventColumn(events) {
    let usedPositions = events.map((event) => event.columnPosition);

    events.forEach((event) => {
        if (events.length > event.concurentEvents) {
            let position = 1;
            event.concurentEvents = events.length;
            while (!event.columnPosition) {
                if (!usedPositions.includes(position)) {
                    event.columnPosition = position;
                    usedPositions.push(position);
                } else position++;
            }
        }
    });
}

export function createEvent(collection, model) {
    model["concurentEvents"] = 1;
    model["columnPosition"] = undefined;
    if (!collection[model.boat_category_id]) collection[model.boat_category_id] = [];
    collection[model.boat_category_id].push(model);
}

export var operators = {
    search: (a, b) => b === null || b.length < 3 || (a !== null && a.indexOf(b) !== -1),
    "==": (a, b) => a == b,
    "===": (a, b) => a === b,
    "!=": (a, b) => a != b,
    "!==": (a, b) => a !== b,
    "<": (a, b) => a < b,
    "<=": (a, b) => a <= b,
    ">": (a, b) => a > b,
    ">=": (a, b) => a >= b,
    inOrNull: (a, b) => {
        if (a === null) return true;
        if (Array.isArray(a) && a.length === 0) return true;
        //using concat() to wrap in an array if not already
        let numberIn = _.intersection([].concat(a), [].concat(b));
        return numberIn.length > 0;
    },
    in: (a, b) => {
        //using concat() to wrap in an array if not already
        let numberIn = _.intersection([].concat(a), [].concat(b));
        return numberIn.length > 0;
    },
    notIn: (a, b) => {
        return !b.includes(a);
    },
};

export function wrapCsvValue(val, formatFn) {
    let formatted = formatFn !== void 0 ? formatFn(val) : val;

    formatted = formatted === void 0 || formatted === null ? "" : String(formatted);

    formatted = formatted.split('"').join('""');
    /**
     * Excel accepts \n and \r in strings, but some other CSV parsers do not
     * Uncomment the next two lines to escape new lines
     */
    // .split('\n').join('\\n')
    // .split('\r').join('\\r')

    return `"${formatted}"`;
}

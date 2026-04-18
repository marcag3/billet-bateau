import { i18n } from "src/boot/i18n";
import { date } from "quasar";
import { dayjs } from "src/boot/dayjs";

const { t } = i18n.global;
export class Model {
    get primaryKey() {
        return this[this.constructor.PRIMARY_KEY_NAME];
    }
    static PRIMARY_KEY_NAME = "id";

    formatToSend() {
        return _.cloneDeep(this);
    }
    get displayName() {
        return this.name;
    }
    formatBool = (attribute) => {
        return this[attribute] ? t("yes") : t("no");
    };
    formatDate = (attribute) => {
        // if (typeof this[attribute] === "string" || this[attribute] instanceof String) return this[attribute];
        return date.formatDate(this[attribute], "YYYY-MM-DD");
    };
    formatDateLong = (attribute) => {
        return dayjs(this[attribute]).format("D MMMM YYYY");
    };
    formatTime = (attribute) => {
        return date.formatDate(this[attribute], "HH:mm");
    };
    formatDateTime = (attribute) => {
        return date.formatDate(this[attribute], "YYYY-MM-DD HH:mm");
    };
    formatMoney = (attribute) => {
        const formatter = new Intl.NumberFormat("fr-CA", {
            style: "currency",
            currency: "CAD",
            currencyDisplay: "symbol",
            minimumFractionDigits: 2,
        });
        return formatter.format(this[attribute]);
    };
    formatOption = (attribute) => {
        if (this.constructor[attribute + "Options"]) {
            return this.constructor[attribute + "Options"].find((option) => option.value == this[attribute]).label;
        }
        return "error";
    };
    formatDuration = (attribute, unit) => {
        return dayjs.duration(this[attribute], unit).humanize();
    };
}

import * as validators from "@vuelidate/validators";
import { i18n } from "boot/i18n";
import { helpers } from "@vuelidate/validators";
import { withI18nMessage } from "./withI18nMessage";

const { t } = i18n.global;

export const required = withI18nMessage(validators.required);
export const requiredIf = (condition) => withI18nMessage(validators.requiredIf(condition));
export const email = withI18nMessage(validators.email);
export const minValue = (value) => withI18nMessage(validators.minValue(value));
export const maxValue = (value) => withI18nMessage(validators.maxValue(value));
export const minLength = (value) => withI18nMessage(validators.minLength(value));
export const maxLength = (value) => withI18nMessage(validators.maxLength(value));
export const lessThanTotalCapacity = (value) => withI18nMessage(validators.maxValue(value));
export const confirmPassword = (value) => withI18nMessage(validators.sameAs(value));
export const isTrueWhen = (condition) =>
    withI18nMessage(
        helpers.withParams({ type: "isTrueWhen", condition }, (value) => (condition ? value == true : true))
    );

export const noRule = () => true;

export const telephone = helpers.withMessage(
    t("vm.valid_phone"),
    helpers.regex(/^\+1 ([2-9][0-8][0-9])-([2-9][0-9]{2})-([0-9]{4})( x[0-9]+)?$/)
);
export const postalCode = withI18nMessage(
    helpers.withParams(
        { type: "postalCode" },
        (value) =>
            !helpers.req(value) ||
            /^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ] [0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]/.test(value)
    )
);
export const isTime = withI18nMessage(
    helpers.withParams(
        { type: "isTime" },
        (value) => !helpers.req(value) || /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
    )
);

export const isDate = withI18nMessage(
    helpers.withParams({ type: "isDate" }, (value) => !helpers.req(value) || Date.parse(value))
);

export const isDateTime = withI18nMessage(
    helpers.withParams({ type: "isDateTime" }, (value) => !helpers.req(value) || Date.parse(value))
);

export const dateAfter = (theDate) =>
    withI18nMessage(
        helpers.withParams(
            { type: "dateAfter", date: theDate },
            (value) => new Date(value.split("-")[0], value.split("-")[1] - 1, value.split("-")[2]) >= theDate
        )
    );
export const minPerBoat = (numberOfBoats, minPersonPerBoat) =>
    withI18nMessage(
        helpers.withParams(
            { min: minPersonPerBoat, type: "minPerBoat" },
            (value) => value / numberOfBoats >= minPersonPerBoat
        )
    );

export const maxPeopleVal = (max) => helpers.withMessage(t("vm.too_many_people"), validators.maxValue(max));
export const maxTeensVal = (max) => helpers.withMessage(t("vm.too_many_teens"), validators.maxValue(max));
export const maxChildrenVal = (max) => helpers.withMessage(t("vm.too_many_children"), validators.maxValue(max));
export const maxBoatsVal = (max) => helpers.withMessage(t("vm.too_many_boats"), validators.maxValue(max));

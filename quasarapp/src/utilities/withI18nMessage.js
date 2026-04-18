import { i18n } from "boot/i18n";
import { helpers } from "@vuelidate/validators";

const { t } = i18n.global;

export const withI18nMessage = (validator) =>
    helpers.withMessage(
        (props) =>
            t(`vm.${props.$validator}`, {
                property: props.$property,
                ...props.$params,
            }),
        validator
    );

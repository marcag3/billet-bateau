import { i18n } from "boot/i18n";

const { t } = i18n.global;
export function formatBool(value) {
    return value ? t("yes") : t("no");
}

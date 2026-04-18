<template>
    <q-btn-toggle
        v-model="lang"
        :options="langOptions"
        emit-value
        no-caps
        toggle-color="secondary"
        dense
        class="no-shadow q-ml-md"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, watch } from "vue";
    import { useQuasar } from "quasar";
    import config from "src/config.json";
    import { dayjs } from "src/boot/dayjs";

    export default {
        // name: 'ComponentName',
        setup() {
            const { locale } = useI18n({ useScope: "global" });
            const $q = useQuasar();

            const langOptions = [
                {
                    label: "English",
                    value: "en-US",
                },
                {
                    label: "Français",
                    value: "fr",
                },
            ];
            const lang = ref(locale);

            watch(lang, (val) => {
                locale.value = val;
                const dayjsLang = val.match(/en/) ? "en-ca" : "fr-ca";
                import(
                    /* webpackInclude: /(fr-ca|en-ca)\.js$/ */
                    "dayjs/locale/" + dayjsLang
                ).then((dayjsLang) => {
                    dayjs.locale(dayjsLang);
                });
                import(
                    /* webpackInclude: /(fr|en-US)\.js$/ */
                    "quasar/lang/" + val
                ).then((lang) => {
                    $q.lang.set(lang.default);
                });
                $q.cookies.set("language_preference", val, config.cookiesOptions);
            });
            return {
                lang,
                langOptions,
            };
        },
    };
</script>

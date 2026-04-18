<template>
    <q-banner class="bg-warning">
        <div class="text-subtitle2">
            {{ t("please_enter_contact_info") }}
        </div>
        <template v-slot:action>
            <q-btn
                :class="route.name === 'client.profile' ? 'hidden' : ''"
                :to="{ name: 'client.profile' }"
                :label="t('client_profile')"
            />
        </template>
    </q-banner>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { useRoute } from "vue-router";
    export default {
        // name: 'ComponentName',
        setup() {
            const { t } = useI18n();
            const route = useRoute();

            return {
                t,
                route,
            };
        },
    };
</script>

<template>
    <q-dialog :model-value="true">
        <q-card>
            <q-card-section>
                <div class="text-h6">{{ t("confirm_delete") }}</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
                {{ t("confirm_delete_text") }}
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat :label="t('cancel')" color="dark" v-close-popup />
                <q-btn flat :label="t('delete')" color="warning" @click="$emit('deleteConfirmed')" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script>
    import { useI18n } from "vue-i18n";
    export default {
        name: "ConfirmDelete",

        props: {},
        emits: ["deleteConfirmed"],
        setup() {
            const { t } = useI18n();
            return {
                t,
            };
        },
    };
</script>

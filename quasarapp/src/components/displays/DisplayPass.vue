<template>
    <q-card class="q-mb-sm q-pa-sm row">
        <div class="col-grow">
            <span class="text-subtitle1">
                {{ pass.subscription.name }}
                <br />
            </span>
            {{ pass.displayExpiryDate }} <br />
        </div>
    </q-card>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { Pass } from "src/store/passes";
    export default {
        // name: 'ComponentName',
        props: {
            pass: Pass,
        },
        setup() {
            const { t } = useI18n();
            return {
                t,
            };
        },
    };
</script>

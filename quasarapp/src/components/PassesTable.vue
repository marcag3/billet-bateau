<template>
    <BasicModelTable :resourceStore="passes" :columns="columns" :filters="filters" />
</template>

<script>
    import { usePasses } from "src/store/passes";
    import { computed, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "./templates/BasicModelTable.vue";
    import { useSubscriptions } from "src/store/subscriptions";
    import { formatBool } from "src/utilities/formatters";
    export default {
        components: { BasicModelTable },
        props: {
            client_id: Number,
        },
        emits: ["updated"],
        // name: 'ComponentName',
        setup(props) {
            const { t } = useI18n();
            const passes = usePasses();
            const subscriptions = useSubscriptions();

            onMounted(() => {
                props.client_id
                    ? passes.getIndex({ client_id: props.client_id, withUnavailable: true })
                    : passes.getIndex({ withUnavailable: true });
                subscriptions.getIndexDebounce();
            });
            return {
                t,
                passes,
                filters: computed(() => {
                    if (props.client_id)
                        return {
                            client_id: {
                                path: "client_id",
                                value: props.client_id,
                            },
                        };
                    return {};
                }),
                columns: [
                    {
                        name: "subscription",
                        label: t("subscription"),
                        field: (row) => row.subscription.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "permits_boarding",
                        label: t("permits_boarding"),
                        field: (row) => row.subscription.permits_boarding,
                        align: "left",
                        filter: "text",
                        required: true,
                        format: formatBool,
                    },
                    {
                        name: "expiry_date",
                        label: t("expiry_date"),
                        field: (row) => row.formatExpiryDate,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                ],
            };
        },
    };
</script>

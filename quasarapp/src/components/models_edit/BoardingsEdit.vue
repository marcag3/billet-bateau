<template>
    <q-card-section class="q-pa-none">
        <!-- items list -->
        <NestedModelTable
            v-model="sailingPlan.boardings"
            modelName="boarding"
            :columns="columns"
            @add="sailingPlan.boardings.push(new Boarding())"
        />
    </q-card-section>
</template>

<script>
    import { onMounted, computed } from "vue";
    import NestedModelTable from "src/components/templates/NestedModelTable.vue";
    import { SailingPlan, Boarding } from "src/store/sailingPlans";
    import { useI18n } from "vue-i18n";
    import { useProducts } from "src/store/products";
    import { useSubscriptions } from "src/store/subscriptions";
    import { required } from "src/utilities/validators";
    import { useClients } from "src/store/clients";
    import { useTickets } from "src/store/tickets";
    import { usePasses } from "src/store/passes";
    export default {
        components: { NestedModelTable },
        // name: 'ComponentName',
        props: {
            sailingPlan: SailingPlan,
        },
        setup(props) {
            const { t } = useI18n();
            const products = useProducts();
            const subscriptions = useSubscriptions();
            const clients = useClients();
            const tickets = useTickets();
            const passes = usePasses();

            onMounted(() => {
                products.getIndexDebounce();
                subscriptions.getIndexDebounce();
            });
            const clientsIds = computed(() => {
                if (props.sailingPlan.boardings.length === 0) return [];
                return props.sailingPlan.boardings.map(({ client_id }) => client_id);
            });
            return {
                Boarding,
                t,
                columns: computed(() => [
                    {
                        name: "client_id",
                        component: "BasicModelSelect",
                        rules: { required },
                        attributes: {
                            modelStore: clients,
                            filters: {
                                // noClone: {
                                //     path: "id",
                                //     operator: "notIn",
                                //     value: clientsIds.value,
                                // },
                            },
                        },
                    },
                    {
                        name: "boarding_item",
                        component: "PolymorphicSelect",
                        rules: { required },
                        label: t("boarding_item"),
                        condition: (boarding) => !!boarding.client_id,
                        attributes: {
                            models: [
                                {
                                    store: tickets,
                                    filters: {
                                        clients: {
                                            path: "client_id",
                                            operator: "in",
                                            value: clientsIds.value,
                                        },
                                    },
                                },
                                {
                                    store: passes,
                                    filters: {
                                        clients: {
                                            path: "client_id",
                                            operator: "in",
                                            value: clientsIds.value,
                                        },
                                        permitsBoarding: {
                                            path: "permits_boarding",
                                            value: true,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ]),
            };
        },
    };
</script>

<template>
    <ModelEditTemplate
        :model-store="subscriptions"
        :model="subscription"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed, onMounted } from "vue";
    import { Subscription, useSubscriptions } from "src/store/subscriptions";
    import { required, noRule } from "src/utilities/validators";
    import { usePromotions } from "src/store/promotions";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useBoatCategories } from "src/store/boatCategories";
    import { usePointsOfSale } from "src/store/pointsOfSale";

    export default {
        components: {
            ModelEditTemplate,
        },
        // name: 'ComponentName',
        props: { create: Boolean },

        emits: ["updated", "deleted"],
        setup(props) {
            const { t } = useI18n(),
                subscriptions = useSubscriptions(),
                subscription = ref(),
                promotions = usePromotions(),
                boatCategories = useBoatCategories(),
                pointsOfSale = usePointsOfSale();

            subscription.value = props.create ? new Subscription() : new Subscription(subscriptions.current);

            const rules = computed(() => ({
                name: { required },
                price: { required },
                duration: { noRule },
                add_promotion_id: { noRule },
                is_taxable: { required },
                permits_boarding: { noRule },
                boat_categories_id: { noRule },
                is_rental: { noRule },
                max_passenger: { noRule },
                available_points_of_sale_ids: { noRule },
                is_full_boat: { noRule },
                fiscal_year_expiry: { noRule },
            }));

            onMounted(() => {
                promotions.getIndex();
            });

            return {
                t,
                subscriptions,
                subscription,
                rules,
                fields: [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    { name: "price", icon: "fas fa-tag", component: "MyInput", attributes: { suffix: "$" } },
                    {
                        name: "fiscal_year_expiry",
                        icon: "fas fa-book-dead",
                        component: "MyToggle",
                    },
                    {
                        condition: () => subscription.value.fiscal_year_expiry !== true,
                        name: "duration",
                        icon: "fas fa-hourglass-half",
                        component: "MyInput",
                        attributes: { suffix: t("day", 2) },
                    },
                    {
                        name: "add_promotion_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: promotions },
                    },
                    {
                        name: "is_taxable",
                        icon: "fas fa-money-bill-wave-alt",
                        component: "MyToggle",
                    },
                    {
                        name: "available_points_of_sale_ids",
                        component: "MultipleModelSelect",
                        attributes: { modelStore: pointsOfSale },
                    },
                    {
                        name: "permits_boarding",
                        icon: "fas fa-ticket-alt",
                        component: "MyToggle",
                        fields: [
                            {
                                name: "boat_categories_id",
                                component: "MultipleModelSelect",
                                attributes: { modelStore: boatCategories },
                            },
                            {
                                name: "is_rental",
                                icon: "fas fa-truck-pickup",
                                component: "MyToggle",
                                attributes: { toggleIndeterminate: true },
                            },
                            {
                                name: "max_passenger",
                                icon: "fas fa-users",
                                component: "MyInput",
                            },
                            {
                                name: "is_full_boat",
                                component: "MyToggle",
                                icon: "fas fa-expand-arrows-alt",
                                attributes: { toggleIndeterminate: true },
                            },
                        ],
                    },
                ],
            };
        },
    };
</script>

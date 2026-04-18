<template>
    <ModelEditTemplate
        :model-store="products"
        :model="product"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Product, useProducts } from "src/store/products";
    import { required, minValue, noRule } from "src/utilities/validators";
    import { useBoatCategories } from "src/store/boatCategories";
    import { useSubscriptions } from "src/store/subscriptions";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
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
                products = useProducts(),
                product = ref(),
                boatCategories = useBoatCategories(),
                subscriptions = useSubscriptions(),
                pointsOfSale = usePointsOfSale();
            product.value = props.create ? new Product() : new Product(products.current);

            const rules = computed(() => ({
                name: { required },
                price: { required },
                boat_category_id: { required },
                duration: { required },
                required_subscription_id: { noRule },
                required_products_id: { noRule },
                replace_products_id: { noRule },
                max_passenger: { minValue: minValue(0) },
                is_rental: { noRule },
                is_initiation: { noRule },
                is_taxable: { noRule },
                is_child: { noRule },
                is_teen: { noRule },
                is_adult: { noRule },
                available_points_of_sale_ids: { noRule },
                is_full_boat: { noRule },
            }));

            return {
                t,
                products,
                product,
                boatCategories,
                subscriptions,
                pointsOfSale,
                rules,
                fields: [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    { name: "price", icon: "fas fa-tag", component: "MyInput", attributes: { suffix: "$" } },
                    {
                        name: "boat_category_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: boatCategories },
                    },
                    {
                        name: "duration",
                        icon: "fas fa-hourglass-half",
                        component: "MyInput",
                        attributes: { suffix: "min" },
                    },
                    {
                        name: "max_passenger",
                        icon: "fas fa-users",
                        component: "MyInput",
                    },
                    {
                        name: "required_subscription_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: subscriptions },
                    },
                    {
                        name: "required_products_id",
                        component: "MultipleModelSelect",
                        attributes: { modelStore: products },
                    },
                    {
                        name: "replace_products_id",
                        component: "MultipleModelSelect",
                        attributes: { modelStore: products },
                    },
                    {
                        name: "is_rental",
                        component: "MyToggle",
                        icon: "fas fa-truck-pickup",
                    },
                    {
                        name: "is_initiation",
                        component: "MyToggle",
                        icon: "fas fa-hand-rock",
                    },
                    {
                        name: "is_taxable",
                        component: "MyToggle",
                        icon: "fas fa-money-bill-wave-alt",
                    },
                    {
                        name: "is_child",
                        component: "MyToggle",
                        icon: "fas fa-child",
                    },
                    {
                        name: "is_teen",
                        component: "MyToggle",
                        icon: "fas fa-snowboarding",
                    },
                    {
                        name: "is_adult",
                        component: "MyToggle",
                        icon: "fas fa-user-tie",
                    },
                    {
                        name: "available_points_of_sale_ids",
                        component: "MultipleModelSelect",
                        attributes: { modelStore: pointsOfSale },
                    },
                    {
                        name: "is_full_boat",
                        component: "MyToggle",
                        icon: "fas fa-expand-arrows-alt",
                    },
                ],
            };
        },
    };
</script>

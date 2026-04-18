<template>
    <ModelEditTemplate
        :model-store="promotions"
        :model="promotion"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Promotion, usePromotions } from "src/store/promotions";
    import { required, noRule, isDate } from "src/utilities/validators";
    import { useProducts } from "src/store/products";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";

    export default {
        components: {
            ModelEditTemplate,
        },
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        setup(props) {
            const { t } = useI18n(),
                promotions = usePromotions(),
                promotion = ref(),
                products = useProducts();

            promotion.value = props.create ? new Promotion() : new Promotion(promotions.current);

            const rules = computed(() => ({
                name: { required },
                value: { required },
                is_percentage: { required },
                products_id: { noRule },
                is_on_client: { required },
                code: { noRule },
                start_date: { isDate },
                end_date: { isDate },
                is_on_invoice_total: { noRule },
            }));

            return {
                t,
                promotions,
                promotion,
                products,
                rules,
                fields: computed(() => [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    {
                        name: "value",
                        icon: "fas fa-tag",
                        component: "MyInput",
                        attributes: { suffix: promotion.value.is_percentage ? "%" : "$" },
                    },
                    { name: "is_percentage", icon: "fas fa-percentage", component: "MyToggle" },
                    { name: "products_id", component: "MultipleModelSelect", attributes: { modelStore: products } },
                    { name: "is_on_client", icon: "fas fa-user", component: "MyToggle" },
                    { name: "code", icon: "fas fa-barcode", component: "MyInput" },
                    {
                        name: "start_date",
                        icon: "fas fa-calendar-plus",
                        component: "MyDateSelect",
                        attributes: { clearable: true },
                    },
                    {
                        name: "end_date",
                        icon: "fas fa-calendar-minus",
                        component: "MyDateSelect",
                        attributes: { clearable: true },
                    },
                    { name: "is_on_invoice_total", icon: "fas fa-layer-group", component: "MyToggle" },
                ]),
            };
        },
    };
</script>

<template>
    <ModelEditTemplate
        :model-store="coupons"
        :model="coupon"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('updated')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Coupon, useCoupons } from "src/store/coupons";
    import { required } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useClients } from "src/store/clients";
    import { usePromotions } from "src/store/promotions";

    export default {
        components: {
            ModelEditTemplate,
        },
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated"],
        setup(props) {
            const { t } = useI18n(),
                coupons = useCoupons(),
                coupon = ref();
            const clients = useClients();
            const promotions = usePromotions();
            coupon.value = props.create ? new Coupon({ client_id: clients.current.id }) : new Coupon(coupons.current);

            const rules = computed(() => ({
                client_id: { required },
                promotion_id: { required },
            }));

            return {
                t,
                coupons,
                coupon,
                rules,
                fields: [
                    { name: "client_id", component: "BasicModelSelect", attributes: { modelStore: clients } },
                    { name: "promotion_id", component: "BasicModelSelect", attributes: { modelStore: promotions } },
                ],
            };
        },
    };
</script>

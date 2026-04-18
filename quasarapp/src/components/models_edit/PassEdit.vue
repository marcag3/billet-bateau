<template>
    <ModelEditTemplate
        :model-store="passes"
        :model="pass"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('updated')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Pass, usePasses } from "src/store/passes";
    import { required, isDate } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useSubscriptions } from "src/store/subscriptions";
    import { useClients } from "src/store/clients";

    export default {
        components: {
            ModelEditTemplate,
        },
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated"],
        setup(props) {
            const { t } = useI18n(),
                passes = usePasses(),
                pass = ref();
            const subscriptions = useSubscriptions();
            const clients = useClients();
            pass.value = props.create ? new Pass({ client_id: clients.current.id }) : new Pass(passes.current);

            const rules = computed(() => ({
                client_id: { required },
                subscription_id: { required },
                expiry_date: { required, isDate },
            }));

            return {
                t,
                passes,
                pass,
                rules,
                fields: [
                    { name: "client_id", component: "BasicModelSelect", attributes: { modelStore: clients } },
                    {
                        name: "subscription_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: subscriptions },
                        onChange: () => {
                            pass.value.expiry_date = pass.value.subscription.defaultExpiryDate;
                        },
                    },
                    { name: "expiry_date", component: "MyDateSelect", icon: "fas fa-calendar-minus" },
                ],
            };
        },
    };
</script>

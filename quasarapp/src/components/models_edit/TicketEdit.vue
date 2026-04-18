<template>
    <ModelEditTemplate
        :model-store="tickets"
        :model="ticket"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('updated')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Ticket, useTickets } from "src/store/tickets";
    import { required } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useProducts } from "src/store/products";
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
                tickets = useTickets(),
                ticket = ref();
            const products = useProducts();
            const clients = useClients();
            ticket.value = props.create
                ? new Ticket({ client_id: clients.current.id, remaining_uses: 1 })
                : new Ticket(tickets.current);

            const rules = computed(() => ({
                client_id: { required },
                product_id: { required },
                remaining_uses: { required },
            }));

            return {
                t,
                tickets,
                ticket,
                rules,
                fields: [
                    { name: "client_id", component: "BasicModelSelect", attributes: { modelStore: clients } },
                    { name: "product_id", component: "BasicModelSelect", attributes: { modelStore: products } },
                    { name: "remaining_uses", component: "MyInput", icon: "fas fa-check-double" },
                ],
            };
        },
    };
</script>

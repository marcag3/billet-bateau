<template>
    <ModelEditTemplate
        full-width
        :model-store="invoices"
        :model="invoice"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('updated')"
    >
        <InvoiceItemEdit :invoice="invoice" />
        <InvoicePaymentEdit :invoice="invoice" />
    </ModelEditTemplate>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Invoice, useInvoices } from "src/store/invoices";
    import { required, noRule, isDateTime } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useClients } from "src/store/clients";
    import { useUsers } from "src/store/users";
    import { usePointsOfSale } from "src/store/pointsOfSale";
    import { InvoiceItem } from "src/store/invoices";
    import InvoiceItemEdit from "src/components/models_edit/InvoiceItemEdit.vue";
    import InvoicePaymentEdit from "src/components/models_edit/InvoicePaymentEdit.vue";
    import { useUser } from "src/store/user";

    export default {
        components: {
            ModelEditTemplate,
            InvoiceItemEdit,
            InvoicePaymentEdit,
        },
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated"],
        setup(props) {
            const { t } = useI18n(),
                invoices = useInvoices(),
                invoice = ref();
            const clients = useClients();
            const users = useUsers();
            const pointsOfsale = usePointsOfSale();

            invoice.value = props.create
                ? new Invoice({ client_id: clients.current ? clients.current.id : null, user_id: useUser().id })
                : new Invoice(invoices.current);

            const rules = computed(() => ({
                client_id: { required },
                user_id: { noRule },
                invoice_date: { required, isDateTime },
                status: { required },
                point_of_sale_id: { required },
            }));

            return {
                t,
                InvoiceItem,
                invoices,
                invoice,
                rules,
                fields: [
                    { name: "client_id", component: "BasicModelSelect", attributes: { modelStore: clients } },
                    {
                        name: "user_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: users },
                    },
                    { name: "invoice_date", component: "MyDateTimeSelect", icon: "fas fa-calendar-day" },
                    {
                        name: "status",
                        component: "MyBtnToggle",
                        icon: "fas fa-info",
                        attributes: { options: Invoice.statusOptions },
                    },
                    {
                        name: "point_of_sale_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: pointsOfsale },
                    },
                ],
            };
        },
    };
</script>

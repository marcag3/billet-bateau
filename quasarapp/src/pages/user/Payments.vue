<template>
    <BasicModelTable :resourceStore="payments" :columns="columns" />
</template>

<script>
    import { usePayments } from "src/store/payments";
    import { defineComponent, ref, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useUsers } from "src/store/users";
    import { useInvoices } from "src/store/invoices";
    import { useClients } from "src/store/clients";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const payments = usePayments();
            const users = useUsers();
            const invoices = useInvoices();
            const clients = useClients();

            onMounted(() => {
                payments.getIndex();
                users.getIndexDebounce();
                invoices.getIndexDebounce();
                clients.getIndexDebounce();
            });

            return {
                t,
                payments,
                columns: ref([
                    {
                        name: "payment_date",
                        label: t("payment_date"),
                        field: (row) => row.formatDateTime("payment_date"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "amount",
                        label: t("amount"),
                        field: (row) => row.formatMoney("totalAmount"),
                        align: "right",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "method",
                        label: t("method"),
                        field: (row) => row.formatOption("method"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "user",
                        label: t("user"),
                        field: (row) => row.user.name,
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                    {
                        name: "client",
                        label: t("client"),
                        field: (row) => row.client.fullName,
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                ]),
            };
        },
    });
</script>

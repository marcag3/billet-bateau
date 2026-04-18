<template>
    <BasicModelTable :resourceStore="invoices" :columns="columns" :filters="filters">
        <q-btn
            dense
            class="q-mx-sm"
            flat
            color="primary"
            :disable="invoices.isLoading || invoices.selected.length !== 1"
            :label="t('send_invoice')"
            icon="fas fa-at"
            @click="invoices.sendInvoice(invoices.current)"
        />
        <q-btn
            dense
            class="q-mx-sm"
            flat
            color="primary"
            :disable="invoices.isLoading || invoices.selected.length !== 1"
            :label="t('print_invoice')"
            icon="fas fa-print"
            @click="invoices.printInvoice(invoices.current)"
        />
    </BasicModelTable>
</template>

<script>
    import { useInvoices } from "src/store/invoices";
    import { onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable.vue";
    import { useProducts } from "src/store/products";
    import { usePointsOfSale } from "src/store/pointsOfSale";
    import { useUsers } from "src/store/users";

    export default {
        components: { BasicModelTable },
        props: {
            client_id: Number,
        },
        emits: ["updated"],
        // name: 'ComponentName',
        setup(props, { emit }) {
            const { t } = useI18n();
            const invoices = useInvoices();
            const products = useProducts();
            const pointsOfSale = usePointsOfSale();
            const users = useUsers();

            onMounted(() => {
                props.client_id ? invoices.getIndex({ client_id: props.client_id }) : invoices.getIndex();
                products.getIndexDebounce();
                pointsOfSale.getIndexDebounce();
                users.getIndexDebounce();
            });
            return {
                t,
                invoices,
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
                        name: "user",
                        label: t("user"),
                        field: (row) => row.user.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "client",
                        label: t("client"),
                        field: (row) => row.clientName,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "invoice_date",
                        label: t("invoice_date"),
                        field: (row) => row.formatDate("invoice_date"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "total",
                        label: t("total"),
                        field: (row) => row.formatMoney("total"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "status",
                        label: t("status"),
                        field: (row) => row.formatOption("status"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "sent_at",
                        label: t("sent_at"),
                        field: (row) => row.formatDateTime("sent_at"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "due_amount",
                        label: t("due_amount"),
                        field: (row) => row.formatMoney("due_amount"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "point_of_sale_id",
                        label: t("point_of_sale_id"),
                        field: (row) => row.pointOfSale.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                ],
            };
        },
    };
</script>

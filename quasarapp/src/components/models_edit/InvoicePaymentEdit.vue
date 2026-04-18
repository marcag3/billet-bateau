<template>
    <q-card-section class="q-pa-none">
        <!-- items list -->
        <NestedModelTable
            v-model="model.invoice_payments"
            modelName="invoice_payment"
            :columns="columns"
            @add="model.invoice_payments.push(new InvoicePayment())"
        />
        <div class="row justify-center items-center">
            <p class="q-px-xl q-py-sm shadow-1 text-bold text-h6">
                {{
                    t("total") +
                    ": " +
                    model.invoice_payments.reduce((total, { amount }) => total + Number(amount), 0) +
                    " $"
                }}
            </p>
        </div>
    </q-card-section>
</template>

<script>
    import NestedModelTable from "src/components/templates/NestedModelTable.vue";
    import { Invoice, InvoicePayment, useInvoices } from "src/store/invoices";
    import { Payment, usePayments } from "src/store/payments";
    import { useI18n } from "vue-i18n";
    import { useProducts } from "src/store/products";
    import { useSubscriptions } from "src/store/subscriptions";
    import { usePromotions } from "src/store/promotions";
    import { onMounted, ref } from "vue";
    import { required, noRule, isDate } from "src/utilities/validators";
    export default {
        components: { NestedModelTable },
        // name: 'ComponentName',
        props: {
            payment: Payment,
            invoice: Invoice,
        },
        setup(props) {
            const { t } = useI18n();
            const products = useProducts();
            const subscriptions = useSubscriptions();
            const promotions = usePromotions();
            const invoices = useInvoices();
            const payments = usePayments();
            let model;
            if (props.payment !== undefined) model = ref(props.payment);
            else if (props.invoice !== undefined) model = ref(props.invoice);

            onMounted(() => {
                products.getIndexDebounce();
                subscriptions.getIndexDebounce();
                promotions.getIndexDebounce();
            });
            let columns = [
                {
                    name: "amount",
                    label: t("amount"),
                    component: "MyInput",
                    icon: "fas fa-coins",
                    rules: { required },
                },
            ];
            if (props.payment !== undefined) {
                columns.unshift({
                    name: "invoice_id",
                    label: t("invoice"),
                    component: "BasicModelSelect",
                    attributes: {
                        modelStore: invoices,
                    },
                    rules: { required },
                    onChange: (invoicePayment) => {
                        const invoice = invoicePayment.invoice;
                        if (invoice === undefined) return;
                        invoicePayment.amount = invoice.total;
                    },
                });
            } else if (props.invoice !== undefined) {
                columns.unshift({
                    name: "payment_id",
                    label: t("payment"),
                    component: "BasicModelSelect",
                    attributes: {
                        modelStore: payments,
                    },
                    rules: { required },
                    onChange: (invoicePayment) => {
                        const payment = invoicePayment.payment;
                        if (payment === undefined) return;
                        invoicePayment.amount = payment.totalAMount;
                    },
                });
            }
            if (!model.value.id) {
                columns[0].attributes.filters = {
                    due: {
                        path: "due_amount",
                        operator: ">",
                        value: 0,
                    },
                };
            }
            return {
                InvoicePayment,
                t,
                model,
                columns,
            };
        },
    };
</script>

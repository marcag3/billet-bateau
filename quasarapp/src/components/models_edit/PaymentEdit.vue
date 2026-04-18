<template>
    <ModelEditTemplate
        full-width
        :model-store="payments"
        :model="payment"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    >
        <InvoicePaymentEdit :payment="payment" />
    </ModelEditTemplate>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Payment, usePayments } from "src/store/payments";
    import { required, noRule, isDateTime } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useUsers } from "src/store/users";
    import { InvoicePayment } from "src/store/invoices";
    import InvoicePaymentEdit from "src/components/models_edit/InvoicePaymentEdit.vue";
    import { dateToDateTimeString } from "src/utilities/helpers";

    export default {
        components: {
            ModelEditTemplate,
            InvoicePaymentEdit,
        },
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        setup(props) {
            const { t } = useI18n(),
                payments = usePayments(),
                payment = ref();
            const users = useUsers();

            payment.value = props.create
                ? new Payment({ payment_date: dateToDateTimeString(new Date()) })
                : new Payment(payments.current);

            const rules = computed(() => ({
                user_id: { noRule },
                payment_date: { required, isDateTime },
                method: { required },
                note: { noRule },
            }));
            const fields = [
                {
                    name: "method",
                    component: "MyBtnToggle",
                    icon: "fas fa-wallet",
                    attributes: { options: payment.value.id ? Payment.methodOptions : Payment.methodOptionsUser },
                },
                {
                    name: "note",
                    icon: "fas fa-pen",
                    component: "MyInput",
                    attributes: { autogrow: true },
                },
            ];

            if (payment.value.id) {
                fields.concat([
                    {
                        name: "user_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: users },
                    },
                    { name: "payment_date", component: "MyDateTimeSelect", icon: "fas fa-calendar-day" },
                ]);
            }

            return {
                t,
                InvoicePayment,
                payments,
                payment,
                rules,
                fields,
            };
        },
    };
</script>

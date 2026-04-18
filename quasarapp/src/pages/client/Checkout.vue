<template>
    <q-card class="row" flat v-if="invoices.current">
        <q-card-section class="col-12 col-md-6">
            <h1 class="text-h5">{{ t("invoice_summary") }}</h1>
            <display-invoice :invoice="invoices.current" />
        </q-card-section>
        <q-card-section class="col-12 col-md-6">
            <h1 class="text-h5">{{ t("payment_informations") }}</h1>

            <form id="payment-form">
                <div id="card-container"></div>
                <q-btn
                    @click="handlePayment"
                    icon="fas fa-credit-card"
                    :disable="disableButton"
                    :loading="disableButton"
                    class="full-width"
                    color="primary"
                    id="card-button"
                    :label="t('pay') + ' ' + invoices.current.formatMoney('due_amount')"
                />
            </form>
        </q-card-section>
    </q-card>
    <q-card flat v-if="appState.isDev">
        <h2 class="text-h5">Cartes de test</h2>

        <q-markup-table wrap-cells flat square>
            <thead>
                <tr><th>Brand</th><th>Number</th><th>CVV</th></tr>
            </thead>
            <tbody>
                <tr><td>Visa</td><td>4111 1111 1111 1111</td><td>111</td></tr>
                <tr><td>Mastercard</td><td>5105 1051 0510 5100</td><td>111</td></tr>
                <tr><td>Discover</td><td>6011 0000 0000 0004</td><td>111</td></tr>
                <tr><td>Diners Club</td><td>3000 000000 0004</td><td>111</td></tr>
                <tr><td>JCB</td><td>3569 9900 1009 5841</td><td>111</td></tr>
                <tr><td>American Express</td><td>3400 000000 00009</td><td>1111</td></tr>
                <tr><td>China UnionPay</td><td>6222 9888 1234 0000</td><td>123</td></tr>
                <tr><td>Square Gift Card</td><td>7783 3200 0000 0000</td><td>❌</td></tr>
            </tbody>
        </q-markup-table>
    </q-card>
</template>

<script>
    import { onMounted, ref } from "vue";
    import { Invoice, useInvoices } from "src/store/invoices";
    import { useClients } from "src/store/clients";
    import { useRouter } from "vue-router";
    import { useAppState } from "src/store/appState";
    import DisplayInvoice from "src/components/displays/DisplayInvoice.vue";
    import { useI18n } from "vue-i18n";
    import { useConfigs } from "src/store/configs";
    import { usePointsOfSale } from "src/store/pointsOfSale";
    import { useSquareCard, createPayment } from "src/composables/useSquareCard";
    import { useQuasar } from "quasar";

    export default {
        components: { DisplayInvoice },
        // name: 'PageName',
        setup() {
            const clients = useClients();
            const invoices = useInvoices();
            const configs = useConfigs();
            const pointsOfSale = usePointsOfSale();
            const appState = useAppState();
            const { t } = useI18n();
            const $q = useQuasar();
            const router = useRouter();
            const disableButton = ref(false);
            if (!clients.current.active_invoice_id) {
                router.push({ name: "client.store" });
            }
            onMounted(async () => {
                await Promise.all([configs.getIndexDebounce(), pointsOfSale.getIndexDebounce()]);
                useSquareCard();
            });

            async function handlePayment() {
                try {
                    // disable the submit button as we await tokenization and make a payment request.
                    disableButton.value = true;
                    const paymentResponse = await createPayment();
                    $q.notify({
                        color: "positive",
                        icon: "cloud_done",
                        message: t("payment_created"),
                    });
                    appState.paymentCreated = true;
                    clients.showCurrent();
                    invoices.current = new Invoice();
                    router.push(appState.nextStep("caisse"));
                } catch (e) {
                    disableButton.value = false;
                    if (e.response && e.response.data)
                        $q.notify({
                            color: "negative",
                            icon: "fas fa-exclamation",
                            message: e.response.data,
                        });
                }
            }

            return {
                t,
                appState,
                disableButton,
                handlePayment,
                invoices,
                clients,
            };
        },
    };
</script>

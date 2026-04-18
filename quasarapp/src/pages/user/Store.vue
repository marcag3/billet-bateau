<template>
    <q-drawer v-model="appState.rightDrawerOpen" side="right" elevated :width="360" :overlay="false">
        <q-card-section>
            <BasicModelSelect
                v-model="clientId"
                @update:model-value="changeClient($event)"
                :modelStore="clients"
                dense
                emitModel
            />
            <template v-if="clients.current.id && invoices.current">
                <p class="text-h6">
                    {{
                        invoices.current.id
                            ? t("invoice") + ": " + invoices.current.id + " " + invoices.current.formatOption("status")
                            : t("new_invoice")
                    }}
                </p>
                <my-date-select
                    :label="t('invoice_date')"
                    v-model="invoices.current.invoice_date"
                    icon="fas fa-calendar-day"
                    dense
                />
                <q-markup-table
                    wrap-cells
                    dense
                    flat
                    v-if="invoices.current.invoice_items && invoices.current.invoice_items.length"
                >
                    <thead>
                        <tr>
                            <th class="text-left">{{ t("item") }}</th>
                            <th class="text-right">Nb</th>
                            <th class="text-right">{{ t("price") }}</th>
                            <th class="text-right">
                                {{ t("actions") }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="invoiceItem in invoices.current.invoice_items" :key="invoiceItem.id">
                            <td class="text-left">{{ invoiceItem.itemable.displayName }} </td>
                            <td class="text-right">{{ invoiceItem.number_of_items }}</td>
                            <td class="text-right">{{ invoiceItem.price * invoiceItem.number_of_items }}$</td>
                            <td class="text-right"
                                ><q-btn
                                    round
                                    icon="fas fa-minus"
                                    size="xs"
                                    color="negative"
                                    @click="removeInvoiceItem(invoiceItem.itemable)"
                            /></td>
                        </tr>
                        <tr style="border-top: 1px solid black" class="text-right text-bold">
                            <td>{{ t("due_amount") }}:</td>
                            <td colspan="2">{{ invoices.current.formatMoney("due_amount") }}</td>
                        </tr>
                    </tbody>
                </q-markup-table>
                <template v-for="error of serverValidations.errors" :key="error">
                    <div class="text-red" v-for="message of error" :key="message">
                        {{ message }}
                    </div>
                </template>
                <div
                    class="q-pt-md q-gutter-sm row"
                    v-if="invoices.current.invoice_items && invoices.current.invoice_items.length > 0"
                >
                    <q-btn
                        class="full-width"
                        :label="t('save_and_square')"
                        color="positive"
                        @click="saveAndSquare"
                        icon="fas fa-square-root-alt"
                    />
                    <q-btn
                        class="full-width"
                        :label="t('save_and_pay')"
                        color="primary"
                        @click="saveAndPay"
                        icon="fas fa-hand-holding-usd"
                    />
                    <q-btn
                        class="full-width"
                        :label="t('save_and_pay_later')"
                        color="secondary"
                        @click="save"
                        icon="fas fa-file-invoice-dollar"
                    />
                </div>
            </template>
        </q-card-section>
    </q-drawer>
    <q-page padding>
        <div class="row q-gutter-sm items-baseline">
            <h1 class="text-h4">
                {{ t("store") }}
            </h1>
        </div>
        <StoreDisplayItemables
            @addInvoiceItem="addInvoiceItem($event)"
            @removeInvoiceItem="removeInvoiceItem($event)"
            v-if="clients.current.id && invoices.current"
            displayPromotions
            :client="clients.current"
            :invoice="invoices.current"
        />
    </q-page>
    <PaymentEdit v-if="showCheckout" @hide="showCheckout = false" @updated="paymentCreated($event)" />
    <ImmediateBoarding v-if="showBoardingChoice" @hide="boardingChoiceClosed" />
</template>

<script>
    import { ref, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import { useClients, Client } from "src/store/clients";
    import { useInvoices, Invoice, InvoicePayment } from "src/store/invoices";
    import BasicModelSelect from "src/components/forms_elements/BasicModelSelect.vue";
    import { useUser } from "src/store/user";
    import MyDateSelect from "src/components/forms_elements/MyDateSelect.vue";
    import { useAppState } from "src/store/appState";
    import PaymentEdit from "src/components/models_edit/PaymentEdit.vue";
    import { Payment, usePayments } from "src/store/payments";
    import StoreDisplayItemables from "src/components/StoreDisplayItemables.vue";
    import { useServerValidations } from "src/store/serverValidations";
    import { useRoutes } from "src/store/routes";
    import { useBoatCategories } from "src/store/boatCategories";
    import ImmediateBoarding from "src/components/ImmediateBoarding";
    import useSquarePos from "src/composables/useSquarePos";
    import { useConfigs } from "src/store/configs";

    export default {
        components: {
            BasicModelSelect,
            MyDateSelect,
            PaymentEdit,
            StoreDisplayItemables,
            ImmediateBoarding,
        },
        setup() {
            const { t } = useI18n();
            const clients = useClients();
            const clientId = ref(clients.current.id);
            const invoices = useInvoices();
            const user = useUser();
            const appState = useAppState();
            const showCheckout = ref(false);
            const payments = usePayments();
            const serverValidations = useServerValidations();
            const showBoardingChoice = ref(false);
            const routes = useRoutes();
            const boatCategories = useBoatCategories();
            const configs = useConfigs();

            onMounted(() => {
                appState.rightDrawerOpen = true;
                configs.getIndexDebounce();
                routes.getIndexDebounce();
                boatCategories.getIndexDebounce();
                //si on a une facture current, selectionner la facture et le client associé à la facture
                if (invoices.current.id) {
                    invoices.showCurrent();
                    clients.showCurrent(invoices.current.client_id);
                    clientId.value = invoices.current.client_id;
                }
                //si on a un client current, selectionner le client pour la caisse
                else if (clients.current.id) {
                    clientId.value = clients.current.id;
                    changeClient(clients.current.id);
                }
            });
            function update() {
                serverValidations.errors = {};
                async function request() {
                    if (invoices.current.id) {
                        return await invoices.updateCurrent();
                    } else {
                        return await invoices.storeCurrent();
                    }
                }
                request()
                    .then(() => {
                        appState.rightDrawerOpen = true;
                    })
                    .catch(() => {
                        if (!!invoices.current.id) {
                            invoices.showCurrent();
                        } else {
                            invoices.current = new Invoice({
                                client_id: clients.current.id,
                                user_id: user.id,
                                invoice_date: new Date().toISOString(),
                                status: 1,
                            });
                        }
                    });
            }
            async function changeClient(newClientId) {
                await clients.showCurrent(newClientId);
                if (!newClientId) {
                    invoices.current = new Invoice();
                } else if (clients.current.active_invoice_id) {
                    invoices.showCurrent(clients.current.active_invoice_id);
                } else {
                    invoices.current = new Invoice({
                        client_id: clients.current.id,
                        user_id: user.id,
                        invoice_date: new Date().toISOString(),
                        status: 1,
                    });
                }
            }
            function reset() {
                invoices.current = new Invoice();
                clientId.value = null;
                clients.current = new Client();
            }

            return {
                t,
                clientId,
                clients,
                invoices,
                appState,
                showCheckout,
                serverValidations,
                showBoardingChoice,
                update,
                changeClient,
                save() {
                    invoices.current.status = Invoice.CONFIRMED;
                    update();
                    invoices.current = new Invoice();
                    clients.current = new Client();
                },
                saveAndPay() {
                    payments.current = new Payment({
                        payment_date: new Date().toISOString(),
                        user_id: user.id,
                        invoice_payments: [
                            new InvoicePayment({
                                invoice_id: invoices.current.id,
                                amount: invoices.current.due_amount,
                            }),
                        ],
                    });
                    showCheckout.value = true;
                },
                saveAndSquare() {
                    const { openURL } = useSquarePos(invoices.current.due_amount);
                    openURL();
                },
                paymentCreated() {
                    showCheckout.value = false;
                    showBoardingChoice.value = true;
                },

                boardingChoiceClosed() {
                    showBoardingChoice.value = false;
                    reset();
                },
                addInvoiceItem(itemable) {
                    invoices.current.addInvoiceItem(itemable.id, itemable.type);
                    update();
                },
                removeInvoiceItem(itemable) {
                    invoices.current.removeInvoiceItem(itemable.id, itemable.type);
                    update();
                },
            };
        },
    };
</script>

<template>
    <q-drawer id="rightDrawer" v-model="appState.rightDrawerOpen" side="right" elevated :width="360" show-if-above>
        <DisplayInvoice
            showActions
            v-if="!!invoices.current.id && invoices.current.invoice_items.length > 0"
            :invoice="invoices.current"
            :serverValidations="serverValidations"
            @removeInvoiceItem="removeInvoiceItem($event)"
        />
    </q-drawer>
    <q-page padding>
        <h1 class="text-h4">
            {{ t("store") }}
        </h1>
        <!-- skeleton -->
        <div v-if="isLoading">
            <div style="min-height: 420px">
                <q-skeleton height="400px" />
            </div>

            <div class="row q-col-gutter-lg">
                <div style="min-height: 310px" class="col-6 col-md-3" v-for="item in 4" :key="item">
                    <q-card>
                        <q-card-section class="text-subtitle1" style="min-height: 88px">
                            <q-skeleton />
                        </q-card-section>
                        <q-separator></q-separator>
                        <q-card-section>
                            <p class="q-ma-none no-wrap row">
                                <q-icon left name="fas fa-users" style="color: rgba(0, 0, 0, 0.54)" />
                                <q-skeleton type="text" width="100%" />
                            </p>
                            <p class="q-ma-none no-wrap row">
                                <q-icon left name="fas fa-clock" style="color: rgba(0, 0, 0, 0.54)" />
                                <q-skeleton type="text" width="100%" />
                            </p>
                            <p class="q-ma-none no-wrap row">
                                <q-icon left name="fas fa-money-check-alt" style="color: rgba(0, 0, 0, 0.54)" />
                                <q-skeleton type="text" width="100%" />
                            </p>
                        </q-card-section>
                        <q-card-section>
                            <q-skeleton type="QBtn" class="bg-primary text-white q-btn">
                                <div class="ellipsis-2-lines">
                                    <q-icon left name="fas fa-cart-plus" />
                                    {{ t("add_to_cart") }}
                                </div>
                            </q-skeleton>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
        <StoreDisplayItemables
            @addInvoiceItem="addInvoiceItem($event)"
            @removeInvoiceItem="removeInvoiceItem($event)"
            v-else
            displayImages
            :client="clients.current"
            :invoice="invoices.current"
        />
    </q-page>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, onMounted } from "vue";
    import { useClients } from "src/store/clients";
    import { useInvoices, Invoice } from "src/store/invoices";
    import { useAppState } from "src/store/appState";
    import DisplayInvoice from "src/components/displays/DisplayInvoice";
    import StoreDisplayItemables from "src/components/StoreDisplayItemables.vue";
    import { useServerValidations } from "src/store/serverValidations";

    export default {
        components: {
            DisplayInvoice,
            StoreDisplayItemables,
        },
        setup() {
            const { t } = useI18n();
            const clients = useClients();
            const isLoading = ref(true);
            const invoices = useInvoices();
            const appState = useAppState();
            const serverValidations = useServerValidations();

            onMounted(async () => {
                await invoices.showCurrent(clients.current.active_invoice_id);
                isLoading.value = false;
                if (invoices.current && invoices.current.invoice_items.length > 0) {
                    appState.rightDrawerOpen = true;
                } else {
                    appState.rightDrawerOpen = false;
                }
            });

            function update() {
                serverValidations.errors = {};

                async function request() {
                    if (invoices.current.id) {
                        return await invoices.update(invoices.current);
                    } else {
                        return await invoices.store(invoices.current);
                    }
                }
                request()
                    .then(async (updatedInvoice) => {
                        invoices.current = updatedInvoice;
                        clients.current.active_invoice_id = updatedInvoice.id;
                        if (invoices.current.invoice_items.length > 0) {
                            appState.rightDrawerOpen = true;
                        } else {
                            appState.rightDrawerOpen = false;
                        }
                    })
                    .catch(async () => {
                        if (!!invoices.current.id) {
                            invoices.showCurrent();
                        } else {
                            invoices.current = new Invoice();
                        }
                    });
            }

            return {
                t,
                isLoading,
                clients,
                invoices,
                update,
                appState,
                serverValidations,
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

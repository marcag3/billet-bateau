<template>
    <q-dialog :model-value="true" :maximized="quasar.screen.lt.sm">
        <q-card>
            <q-card-section class="row">
                <div class="text-h6">
                    {{ t("choose_boarding") }}
                </div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup size="sm" />
            </q-card-section>
            <q-card-section class="row">
                <q-card flat class="col q-pb-xl">
                    <div class="text-subtitle1">
                        {{ t("create_sailing_plan") }}
                    </div>
                    <q-btn
                        icon="fas fa-plus"
                        :label="t('create')"
                        @click="createSailingPlan"
                        color="primary"
                        class="full-width absolute-bottom"
                    />
                </q-card>
                <q-separator vertical spaced />
                <q-card flat class="col q-pb-xl">
                    <div class="text-subtitle1">
                        {{ t("add_to_sailing_plan") }}
                    </div>
                    <basic-model-select v-model="sailingPlanId" :modelStore="sailingPlans" />
                    <q-btn
                        icon="fas fa-user-plus"
                        :label="t('add')"
                        @click="addToSailingPlan"
                        color="primary"
                        class="full-width absolute-bottom"
                    />
                </q-card>
            </q-card-section>
        </q-card>
        <sailing-plan-edit v-if="showSailingPlan" @hide="$emit('hide')" @updated="$emit('hide')" />
    </q-dialog>
</template>

<script>
    import { useQuasar } from "quasar";
    import { useI18n } from "vue-i18n";
    import { onMounted, ref } from "vue";
    import { Boarding, SailingPlan, useSailingPlans } from "src/store/sailingPlans";
    import SailingPlanEdit from "./models_edit/SailingPlanEdit.vue";
    import BasicModelSelect from "./forms_elements/BasicModelSelect.vue";
    import { useClients } from "src/store/clients";
    import { nextDeparture } from "src/utilities/helpers";
    import { useInvoices } from "src/store/invoices";
    import { useTickets } from "src/store/tickets";
    import { usePasses } from "src/store/passes";
    export default {
        components: { SailingPlanEdit, BasicModelSelect },
        emits: ["hide"],
        // name: 'ComponentName',
        setup(props, { emit }) {
            const quasar = useQuasar();
            const { t } = useI18n();
            const sailingPlans = useSailingPlans();
            const showSailingPlan = ref(false);
            const sailingPlanId = ref();
            const clients = useClients();
            const invoices = useInvoices();
            const tickets = useTickets();
            const passes = usePasses();
            const boarding_item = invoices.current.invoice_items.find(
                (invoiceItem) =>
                    invoiceItem.itemable_type === "App\\Product" ||
                    (invoiceItem.itemable_type === "App\\Subscription" && invoiceItem.itemable.permits_boarding)
            );
            let planned_duration;
            let boat_category_id;
            if (boarding_item) {
                planned_duration = boarding_item.itemable.duration;
                boat_category_id = boarding_item.itemable.boat_category_id;
            }

            onMounted(() => {
                sailingPlans.getIndex();
                tickets.getIndex({ client_id: clients.current.id });
                passes.getIndex({ client_id: clients.current.id });
            });
            return {
                t,
                quasar,
                sailingPlans,
                showSailingPlan,
                sailingPlanId,
                createSailingPlan() {
                    sailingPlans.current = new SailingPlan({
                        departure: nextDeparture(),
                        planned_duration,
                        status: SailingPlan.PLANNED,
                        number_of_passengers: 1,
                        boat_category_id,
                        boardings: [
                            new Boarding({
                                client_id: clients.current.id,
                            }),
                        ],
                    });
                    showSailingPlan.value = true;
                },
                addToSailingPlan() {
                    sailingPlans.showCurrent(sailingPlanId.value).then(() => {
                        sailingPlans.current.boardings.push(
                            new Boarding({
                                client_id: clients.current.id,
                                sailing_plan_id: sailingPlanId.value,
                            })
                        );
                        sailingPlans.current.number_of_passengers++;
                        showSailingPlan.value = true;
                    });
                },
                boardingClosed() {
                    showSailingPlan.value = false;
                    emit("hide");
                },
            };
        },
    };
</script>

<template>
    <q-dialog :model-value="true" full-width full-height>
        <q-card ref="scrollable" scroll>
            <q-card-section class="row">
                <div class="text-h6">
                    {{ clients.current.id ? t("edit_" + clients.snakeCaseName) : t("create_" + clients.snakeCaseName) }}
                    :
                    {{ clients.current.displayName }}
                </div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup size="sm" />
            </q-card-section>
            <q-card-section v-if="clients.current.id">
                <q-tabs
                    v-model="tab"
                    class="text-grey"
                    active-color="primary"
                    indicator-color="primary"
                    align="justify"
                >
                    <q-tab name="profile" :label="t('profile')" />
                    <q-tab name="tickets" :label="t('product', 2)" />
                    <q-tab name="passes" :label="t('subscription', 2)" />
                    <q-tab name="coupons" :label="t('promotion', 2)" />
                    <q-tab name="bookings" :label="t('booking', 2)" />
                    <q-tab name="invoices" :label="t('invoice', 2)" />
                </q-tabs>
            </q-card-section>
            <q-card-section>
                <q-tab-panels v-model="tab" animated>
                    <q-tab-panel name="profile">
                        <q-form @submit="save">
                            <ModelEditFields flat :model="clients.current" :fields="fields" :validations="v$" />
                            <q-card-actions align="right">
                                <q-btn
                                    v-if="clients.current.id"
                                    flat
                                    :label="t('delete')"
                                    color="negative"
                                    @click="destroy"
                                />
                                <q-space></q-space>
                                <q-btn flat :label="t('cancel')" color="dark" v-close-popup />
                                <q-btn
                                    flat
                                    :label="clients.current.id ? t('save') : t('create')"
                                    color="positive"
                                    type="submit"
                                />
                            </q-card-actions>
                        </q-form>
                    </q-tab-panel>
                    <q-tab-panel name="tickets">
                        <TicketsTable :client_id="clients.current.id" />
                    </q-tab-panel>
                    <q-tab-panel name="passes">
                        <PassesTable :client_id="clients.current.id" />
                    </q-tab-panel>
                    <q-tab-panel name="coupons">
                        <CouponsTable :client_id="clients.current.id" />
                    </q-tab-panel>
                    <q-tab-panel name="bookings">
                        <BookingsTable :client_id="clients.current.id" />
                    </q-tab-panel>
                    <q-tab-panel name="invoices">
                        <InvoicesTable :client_id="clients.current.id" />
                    </q-tab-panel>
                </q-tab-panels>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed, onMounted } from "vue";
    import { Client, useClients } from "src/store/clients";
    import ModelEditFields from "src/components/templates/ModelEditFields";
    import { required, telephone, isDate, postalCode, email, noRule } from "src/utilities/validators";
    import { useSailingPlans } from "src/store/sailingPlans";
    import { scroll, useQuasar } from "quasar";
    import { useInvoices } from "src/store/invoices";
    import TicketsTable from "src/components/TicketsTable.vue";
    import PassesTable from "src/components/PassesTable.vue";
    import CouponsTable from "src/components/CouponsTable.vue";
    import BookingsTable from "src/components/BookingsTable.vue";
    import InvoicesTable from "src/components/InvoicesTable.vue";
    import { useRoutes } from "src/store/routes";
    import { useBoatCategories } from "src/store/boatCategories";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    const { setVerticalScrollPosition } = scroll;

    export default {
        components: {
            ModelEditFields,
            TicketsTable,
            PassesTable,
            CouponsTable,
            BookingsTable,
            InvoicesTable,
        },
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        setup(props, { emit }) {
            const { t } = useI18n();
            const clients = useClients();
            const tab = ref("profile");
            const sailingPlans = useSailingPlans();
            const scrollable = ref();
            const invoices = useInvoices();
            const routes = useRoutes();
            const boatCategories = useBoatCategories();
            const $q = useQuasar();

            if (props.create) {
                clients.current = new Client();
            } else {
                clients.showCurrent();
            }

            const rules = computed(() => ({
                email: { email },
                firstName: { required },
                name: { required },
                cellphone: { telephone },
                homephone: { telephone },
                emergencyContact: { noRule },
                emergencyPhone: { telephone },
                address: { noRule },
                apartment: { noRule },
                city: { noRule },
                postalCode: { postalCode },
                birthday: { isDate },
                note: { noRule },
                initiation_sailing_plan_id: { noRule },
                identification_card_number: { noRule },
                identification_card_type: { noRule },
            }));
            const phoneMask = "+1 ###-###-#### x#####";

            onMounted(() => {
                // invoices.getIndex({ client_id: clients.current.id });
                routes.getIndexDebounce();
                boatCategories.getIndexDebounce();
            });

            const validations = useServerValidations();
            const v$ = useVuelidate(
                computed(() => rules.value),
                computed(() => clients.current),
                {
                    $externalResults: computed(() => validations.errors),
                    $lazy: true,
                }
            );

            function scrollTop() {
                setVerticalScrollPosition(scrollable.value.$el, 0, 500);
            }

            return {
                t,
                v$,
                tab,
                clients,
                rules,
                phoneMask,
                scrollable,
                invoices,
                fields: [
                    {
                        name: "email",
                        icon: "fas fa-at",
                        component: "MyInput",
                    },
                    { name: "firstName", icon: "fas fa-smile", component: "MyInput" },
                    { name: "name", label: t("surname"), icon: "fas fa-signature", component: "MyInput" },
                    {
                        name: "cellphone",
                        icon: "fas fa-mobile-alt",
                        component: "MyInput",
                        v_mask: phoneMask,
                        attributes: { placeholder: "+1 555-555-5555", type: "tel" },
                    },
                    {
                        name: "homephone",
                        icon: "fas fa-phone",
                        component: "MyInput",
                        v_mask: phoneMask,
                        attributes: { placeholder: "+1 555-555-5555", type: "tel" },
                    },
                    { name: "emergencyContact", icon: "fas fa-ambulance", component: "MyInput" },
                    {
                        name: "emergencyPhone",
                        icon: "fas fa-phone-volume",
                        component: "MyInput",
                        v_mask: phoneMask,
                        attributes: { placeholder: "+1 555-555-5555", type: "tel" },
                    },
                    { name: "address", icon: "fas fa-building", component: "MyInput" },
                    { name: "apartment", icon: "fas fa-door-open", component: "MyInput" },
                    { name: "city", icon: "fas fa-city", component: "MyInput" },
                    {
                        name: "postalCode",
                        v_mask: "A#A #A#",
                        icon: "fas fa-envelope",
                        component: "MyInput",
                        attributes: { placeholder: "H0H 0H0" },
                    },
                    { name: "birthday", icon: "fas fa-birthday-cake", component: "MyDateSelect" },
                    {
                        name: "note",
                        icon: "fas fa-pen",
                        component: "MyInput",
                        attributes: { placeholder: t("note_placeholder"), type: "textarea" },
                    },
                    {
                        name: "initiation_sailing_plan_id",
                        label: t("select_initiation_sailing_plan"),
                        component: "BasicModelSelect",
                        attributes: { modelStore: sailingPlans, hint: t("initiation_hint") },
                    },
                    {
                        name: "identification_card_type",
                        icon: "fas fa-id-card-alt",
                        component: "MyBtnToggle",
                        attributes: { options: clients.current.constructor.identificationCardTypeOptions },
                    },
                    { name: "identification_card_number", icon: "fas fa-id-card", component: "MyInput" },
                ],
                save() {
                    v$.value.$touch();
                    if (v$.value.$error) {
                        scrollTop();
                        return;
                    }

                    async function request() {
                        if (clients.current.id) {
                            return await clients.update(clients.current);
                        } else {
                            return await clients.store(clients.current);
                        }
                    }
                    request()
                        .then((updatedClient) => {
                            $q.notify({
                                color: "positive",
                                icon: "cloud_done",
                                message: t("saved"),
                            });
                            emit("updated", updatedClient);
                        })
                        .catch(() => {
                            scrollTop();
                        });
                },
                destroy() {
                    clients.delete(clients.current).then(() => {
                        emit("deleted");
                        $q.notify({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("deleted"),
                        });
                    });
                },
            };
        },
    };
</script>

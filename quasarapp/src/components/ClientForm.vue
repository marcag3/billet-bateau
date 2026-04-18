<template>
    <div class="col">
        <div class="row justify-center">
            <q-card class="no-border-radius q-mt-md">
                <q-card-section class="text-h4 text-center">
                    {{ t("client_profile") }}
                </q-card-section>
                <q-form @submit="onSubmit" @reset="onReset">
                    <q-stepper
                        keep-alive
                        flat
                        v-model="step"
                        ref="stepper"
                        animated
                        active-color="secondary"
                        header-nav
                        :contracted="$q.screen.lt.sm"
                    >
                        <q-step :name="1" prefix="1" :title="t('minimum_contact_info')">
                            <ModelEditFields
                                :model="clients.current"
                                :fields="fields1"
                                :validations="v$"
                                class="q-pa-none q-gutter-lg q-pb-md"
                            />
                        </q-step>

                        <q-step :name="2" prefix="2" :title="t('full_address')">
                            <ModelEditFields
                                :model="clients.current"
                                :fields="fields2"
                                :validations="v$"
                                class="q-pa-none q-gutter-lg q-pb-md"
                            />
                        </q-step>

                        <q-step :name="3" prefix="3" :title="t('other_info')">
                            <ModelEditFields
                                :model="clients.current"
                                :fields="fields3"
                                :validations="v$"
                                class="q-pa-none q-gutter-lg q-pb-md"
                            />
                        </q-step>

                        <!-- button -->

                        <template v-slot:navigation>
                            <q-stepper-navigation class="row justify-end">
                                <q-btn :label="t('reset')" type="reset" color="primary" flat class="q-ml-sm" />
                                <q-btn
                                    v-if="step > 1"
                                    flat
                                    color="deep-orange"
                                    @click="stepper.previous()"
                                    :label="t('back')"
                                    class="q-ml-sm"
                                />
                                <q-btn
                                    v-if="step < 3"
                                    @click="next"
                                    color="primary"
                                    :label="t('continue')"
                                    class="q-ml-sm"
                                />
                                <q-btn
                                    v-if="step === 3"
                                    type="submit"
                                    :label="t('submit')"
                                    class="q-ml-sm"
                                    color="primary"
                                />
                            </q-stepper-navigation>
                        </template>
                    </q-stepper>
                </q-form>
            </q-card>
        </div>
    </div>
</template>

<script>
    import { defineComponent, onMounted, computed, ref } from "vue";
    import { useQuasar } from "quasar";
    import { useI18n } from "vue-i18n";
    import { useClients } from "src/store/clients";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { required, requiredIf, telephone, isDate, postalCode, noRule } from "src/utilities/validators";
    import ModelEditFields from "./templates/ModelEditFields.vue";

    export default defineComponent({
        name: "ClientForm",
        components: {
            ModelEditFields,
        },
        emits: ["completed"],
        setup(props, { emit }) {
            const { t } = useI18n();
            const $q = useQuasar();
            const clients = useClients();
            const step = ref(1);
            const stepper = ref();

            const phoneMask = "+1 ###-###-#### x#####";
            const phonePlaceHolder = "+1 555-555-5555";
            const fields1 = [
                {
                    name: "firstName",
                    icon: "fas fa-smile",
                    component: "MyInput",
                    attributes: { autofocus: true },
                },
                {
                    name: "name",
                    label: t("surname"),
                    icon: "fas fa-signature",
                    component: "MyInput",
                },
                {
                    name: "cellphone",
                    icon: "fas fa-mobile-alt",
                    component: "MyInput",
                    v_mask: phoneMask,
                    attributes: { placeholder: phonePlaceHolder, type: "tel" },
                },
                {
                    name: "homephone",
                    icon: "fas fa-phone",
                    component: "MyInput",
                    v_mask: phoneMask,
                    attributes: {
                        placeholder: phonePlaceHolder,
                        type: "tel",
                        hint: t("either_homephone_or_cellphone"),
                    },
                },
                { name: "emergencyContact", icon: "fas fa-ambulance", component: "MyInput" },
                {
                    name: "emergencyPhone",
                    icon: "fas fa-phone-volume",
                    component: "MyInput",
                    v_mask: phoneMask,
                    attributes: { placeholder: phonePlaceHolder, type: "tel", hint: t("emergency_contact_hint") },
                },
            ];
            const fields2 = [
                { name: "address", icon: "fas fa-building", component: "MyInput", attributes: { autofocus: true } },
                { name: "apartment", icon: "fas fa-door-open", component: "MyInput" },
                { name: "city", icon: "fas fa-city", component: "MyInput" },
                {
                    name: "postalCode",
                    v_mask: "A#A #A#",
                    icon: "fas fa-envelope",
                    component: "MyInput",
                    attributes: { placeholder: "H0H 0H0" },
                },
            ];
            const fields3 = [
                {
                    name: "birthday",
                    icon: "fas fa-birthday-cake",
                    component: "MyDateSelect",
                    attributes: { autofocus: true },
                },
                {
                    name: "identification_card_type",
                    icon: "fas fa-id-card-alt",
                    component: "MyBtnToggle",
                    attributes: { options: clients.current.constructor.identificationCardTypeOptions },
                },
                { name: "identification_card_number", icon: "fas fa-id-card", component: "MyInput" },
                {
                    name: "note",
                    label: t("a_note"),
                    icon: "fas fa-pen",
                    component: "MyInput",
                    attributes: { placeholder: t("note_placeholder"), type: "textarea" },
                },
            ];

            function fetchData() {
                return clients.showCurrent();
            }

            const validations = useServerValidations();
            const rules = computed(() => ({
                firstName: { required },
                name: { required },
                cellphone: { requiredIf: requiredIf(!clients.current.homephone), telephone },
                homephone: { requiredIf: requiredIf(!clients.current.cellphone), telephone },
                emergencyContact: { required },
                emergencyPhone: { required, telephone },
                address: { noRule },
                apartment: { noRule },
                city: { noRule },
                postalCode: { postalCode },
                birthday: { isDate },
                identification_card_type: { requiredIf: requiredIf(clients.current.wants_to_rent) },
                identification_card_number: { requiredIf: requiredIf(clients.current.wants_to_rent) },
                note: { noRule },
            }));

            const v$ = useVuelidate(
                rules,
                computed(() => clients.current),
                {
                    $externalResults: computed(() => validations.errors),
                    $lazy: true,
                }
            );

            onMounted(() => {
                fetchData();
            });

            return {
                t,
                phoneMask,
                clients,
                stepper,
                step,
                validations,
                v$,
                fields1,
                fields2,
                fields3,
                rules,

                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },

                next() {
                    const error1 = v$.value.$error;
                    v$.value.$touch();

                    if (!error1 && v$.value.$error) return;

                    stepper.value.next();
                },

                onSubmit() {
                    v$.value.$touch();
                    if (v$.value.$error) return;
                    clients
                        .updateConnected()
                        .then(() => emit("completed"))
                        .catch(() => {
                            step.value = 1;
                            v$.value.$touch();
                        });
                },

                onReset() {
                    fetchData().then(() => {
                        $q.notify({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("reseted"),
                        });
                    });
                },
            };
        },
    });
</script>

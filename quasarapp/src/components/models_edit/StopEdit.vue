<template>
    <q-dialog :model-value="true">
        <q-card>
            <q-card-section>
                <div class="text-h6">
                    {{ stop.id ? t("edit_stop") : t("create_stop") }}
                </div>
            </q-card-section>
            <q-form @submit="save">
                <q-card-section class="q-gutter-lg">
                    <!-- stop name -->
                    <q-input
                        :label="t('name')"
                        v-model="stop.name"
                        filled
                        @blur="touch('name')"
                        :error="v$.name.$error"
                        bottom-slots
                    >
                        <template v-slot:before>
                            <q-icon name="fas fa-clipboard" />
                        </template>
                        <template v-slot:error>
                            <template v-for="error of v$.name.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative"></div>
                            </template>
                        </template>
                    </q-input>

                    <!-- lat  -->
                    <q-input
                        step="0.000001"
                        ref="latInput"
                        filled
                        :label="t('lat')"
                        v-model.number="stop.lat"
                        @blur="touch('lat')"
                        :error="v$.lat.$error"
                        type="number"
                        bottom-slots
                    >
                        <template v-slot:before>
                            <q-icon name="fas fa-arrows-alt-v" />
                        </template>
                        <template v-slot:error>
                            <template v-for="error of v$.lat.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative"></div>
                            </template>
                        </template>
                    </q-input>

                    <!-- long -->
                    <q-input
                        step="0.000001"
                        ref="longInput"
                        filled
                        :label="t('long')"
                        v-model.number="stop.long"
                        @blur="touch('long')"
                        :error="v$.long.$error"
                        type="number"
                        bottom-slots
                    >
                        <template v-slot:before>
                            <q-icon name="fas fa-arrows-alt-h" />
                        </template>
                        <template v-slot:error>
                            <template v-for="error of v$.long.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative"></div>
                            </template>
                        </template>
                    </q-input>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn v-if="stop.id" flat :label="t('delete')" color="negative" @click="destroy" />
                    <q-space></q-space>
                    <q-btn flat :label="t('cancel')" color="dark" v-close-popup />
                    <q-btn flat :label="stop.id ? t('save') : t('create')" color="positive" type="submit" />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Stop, useStops } from "src/store/stops";
    import { useQuasar } from "quasar";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { required } from "src/utilities/validators";

    export default {
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        setup(props, { emit }) {
            const { t } = useI18n(),
                stops = useStops(),
                stop = ref(),
                $q = useQuasar();

            stop.value = props.create ? new Stop() : new Stop(stops.current);

            const validations = useServerValidations();
            const rules = {
                name: { required },
                lat: { required },
                long: { required },
            };

            const v$ = useVuelidate(rules, stop, {
                $externalResults: computed(() => validations.errors),
                $lazy: true,
            });

            return {
                t,
                stops,
                stop,
                v$,

                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },

                save() {
                    v$.value.$touch();
                    if (v$.value.$error) return;
                    async function request() {
                        if (stop.value.id) {
                            return await stops.update(stop.value);
                        } else {
                            return await stops.store(stop.value);
                        }
                    }
                    request().then((updatedStop) => {
                        emit("updated", updatedStop);
                        $q.notify({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("saved"),
                        });
                    });
                },
                destroy() {
                    stops.delete(stop.value).then(() => {
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

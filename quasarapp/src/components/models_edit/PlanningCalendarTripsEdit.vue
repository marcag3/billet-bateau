<template>
    <q-dialog :model-value="true">
        <q-card>
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ t("edit_trips") }}</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>
            <q-form @submit="save">
                <q-card-section class="q-gutter-lg">
                    <!-- move -->
                    <q-input
                        v-model="minutesToMove"
                        filled
                        :label="t('minutes_to_move')"
                        type="number"
                        @blur="touch('minutesToMove')"
                        :error="v$.minutesToMove.$error"
                        clearable
                    >
                        <template v-slot:before>
                            <q-icon name="fa fa-exchange-alt" />
                        </template>
                        <template v-slot:error>
                            <template v-for="error of v$.minutesToMove.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative"></div>
                            </template>
                        </template>
                    </q-input>

                    <!-- routeId -->
                    <BasicModelSelect
                        v-model="newRoute"
                        :model-store="routes"
                        :validation="v$.newRoute"
                        @blur="touch('newRoute')"
                    />

                    <!-- Select boat category -->
                    <BasicModelSelect
                        v-model="newBoatCategoryId"
                        :model-store="boatCategories"
                        :validation="v$.newBoatCategoryId"
                        @blur="touch('newBoatCategoryId')"
                    />

                    <!-- Guided -->
                    <div>
                        <div class="row no-wrap items-center">
                            <div class="q-field__before q-field__marginal row items-center gt-xs">
                                <q-icon name="fas fa-hiking" />
                            </div>
                            <q-btn-toggle
                                v-model="newGuided"
                                toggle-color="accent"
                                clearable
                                size="md"
                                :options="[
                                    { label: t('guide_mandatory'), value: 1 },
                                    { label: t('guide_optional'), value: 2 },
                                    { label: t('guide_not_available'), value: 3 },
                                ]"
                                spread
                            />
                        </div>
                    </div>

                    <!-- inventory -->
                    <q-toggle v-if="sameBoatCategory" v-model="newUseInventory" :label="t('use_inventory')" />
                    <BoatInventorySelect
                        v-if="newUseInventory && sameBoatCategory"
                        v-model:boat_inventory_id="newBoatInventory"
                        :boat_category_id="sameBoatCategory"
                    />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat :label="t('cancel')" color="dark" v-close-popup />
                    <q-btn flat :label="t('save')" color="positive" type="submit" />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { useTrips } from "../../store/trips";
    import { date } from "quasar";
    import { useBoatCategories } from "src/store/boatCategories";
    import { useRoutes } from "src/store/routes";
    import BoatInventorySelect from "src/components/forms_elements/BoatInventorySelect.vue";
    import BasicModelSelect from "src/components/forms_elements/BasicModelSelect.vue";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { noRule } from "src/utilities/validators";

    export default {
        name: "MoveTrips",
        emits: ["change"],
        components: {
            BoatInventorySelect,
            BasicModelSelect,
        },

        setup(props, { emit }) {
            const { t } = useI18n();
            const minutesToMove = ref(null);
            const trips = useTrips();
            const newBoatCategoryId = ref();
            const boatCategories = useBoatCategories();
            const routes = useRoutes();
            const newRoute = ref();
            const newGuided = ref();
            const newUseInventory = ref();
            const newBoatInventory = ref();

            const sameBoatCategory = computed(() => {
                return (
                    newBoatCategoryId.value ??
                    ([...new Set(trips.selected.map(({ boat_category_id }) => boat_category_id))].length === 1
                        ? trips.selected[0].boat_category_id
                        : null)
                );
            });

            const validations = useServerValidations();
            const rules = {
                minutesToMove: { noRule },
                newRoute: { noRule },
                newBoatCategoryId: { noRule },
            };

            const v$ = useVuelidate(
                rules,
                { minutesToMove, newRoute },
                {
                    $externalResults: computed(() => validations.errors),
                    $lazy: true,
                }
            );

            return {
                t,
                minutesToMove,
                trips,
                newBoatCategoryId,
                boatCategories,
                newRoute,
                routes,
                newGuided,
                newUseInventory,
                newBoatInventory,
                sameBoatCategory,
                v$,

                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },
                save() {
                    v$.value.$touch();
                    if (v$.value.$error) return;
                    trips.selected.forEach((trip) => {
                        trip.start_time = date.addToDate(trip.start_time, {
                            minutes: minutesToMove.value,
                        });
                        trip.boat_category_id = newBoatCategoryId.value ?? trip.boat_category_id;
                        trip.route_id = newRoute.value ?? trip.route_id;
                        trip.guided = newGuided.value ?? trip.guided;
                        trip.boat_inventory_id = newBoatInventory.value ?? trip.boat_inventory_id;
                    });
                    trips.updateSelected().then(() => emit("change"));
                },
            };
        },
    };
</script>

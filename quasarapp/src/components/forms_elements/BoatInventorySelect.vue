<template>
    <q-select
        ref="boatInventorySelect"
        :label="t('select_boat_inventory')"
        :model-value="boat_inventory_id"
        @update:model-value="$emit('update:boat_inventory_id', $event)"
        @filter="filterFn"
        @new-value="createBoatInventory"
        :hint="t('new_value')"
        :options="options"
        :loading="boatInventories.isLoading"
        emit-value
        map-options
        option-label="displayName"
        option-value="id"
        filled
        use-input
        clearable
        hide-dropdown-icon
        bottom-slots
        :input-debounce="0"
        class="q-mb-lg"
        :disable="disable"
        @blur="touch('boat_inventory_id')"
        :error="v$.boat_inventory_id.$error"
    >
        <template v-slot:before>
            <q-icon name="fas fa-cubes" />
        </template>
        <template v-slot:after>
            <q-btn :disable="boat_inventory_id == null" size="sm" round icon="fas fa-pen" @click="editBoatInventory" />
        </template>
        <template v-slot:error>
            <template v-for="error of v$.boat_inventory_id.$errors" :key="error.$uid">
                <div v-html="error.$message" class="text-negative"></div>
            </template>
        </template>
    </q-select>

    <BoatInventoryEdit
        @updated="updatedBoatInventory"
        @deleted="deletedBoatInventory"
        v-if="boatInventoryEditShow"
        @hide="boatInventoryEditShow = false"
        create="false"
    />
</template>

<script>
    import { ref, computed, watch, onMounted } from "vue";
    import BoatInventoryEdit from "src/components/models_edit/BoatInventoryEdit.vue";
    import { useI18n } from "vue-i18n";
    import { BoatInventory, useBoatInventories } from "src/store/boatInventories";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { requiredIf } from "src/utilities/validators";

    export default {
        // name: 'ComponentName',
        props: { boat_inventory_id: Number, boat_category_id: Number, disable: Boolean, required: Boolean },
        emits: ["update:boat_inventory_id"],
        components: {
            BoatInventoryEdit,
        },
        setup(props) {
            const { t } = useI18n();
            const boatInventorySelect = ref();
            const boatInventories = useBoatInventories();
            const boatInventoryEditShow = ref(false);
            const filters = ref({
                boat_category_id: {
                    path: "boat_category_id",
                    value: props.boat_category_id,
                },
            });
            const options = ref();

            const validations = useServerValidations();
            const rules = computed(() => ({
                boat_inventory_id: { requiredIf: requiredIf(props.required) },
            }));
            const v$ = useVuelidate(rules, props, {
                $externalResults: computed(() => validations.errors),
                $lazy: true,
            });

            watch(
                () => props.boat_category_id,
                () => {
                    boatInventorySelect.value.add(null, true);
                    filters.value = {
                        boat_category_id: {
                            path: "boat_category_id",
                            value: props.boat_category_id,
                        },
                    };
                }
            );

            return {
                t,
                boatInventorySelect,
                boatInventories,
                boatInventoryEditShow,
                v$,
                options,
                filterFn(val, update) {
                    update(() => {
                        options.value = boatInventories.filteredList(filters.value, val);
                    });
                },
                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },

                createBoatInventory(val, done) {
                    boatInventories.current = new BoatInventory({
                        name: val,
                        boat_category_id: props.boat_category_id,
                    });
                    boatInventoryEditShow.value = true;
                    done("");
                },
                editBoatInventory() {
                    v$.value.$touch();
                    if (v$.value.$error) return;
                    boatInventories.selected = [boatInventories.list.find(({ id }) => id == props.boat_inventory_id)];
                    boatInventoryEditShow.value = true;
                },

                updatedBoatInventory(boatInventory) {
                    boatInventorySelect.value.add(boatInventory, true);
                    boatInventorySelect.value.showPopup();
                    boatInventoryEditShow.value = false;
                },
                deletedBoatInventory() {
                    boatInventorySelect.value.add(null, true);
                    boatInventoryEditShow.value = false;
                },
            };
        },
    };
</script>

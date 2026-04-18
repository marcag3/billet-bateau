<template>
    <q-select
        :label="thisLabel"
        ref="qSelect"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @filter="filterFn"
        @blur="$emit('blur', $event)"
        :options="options"
        :loading="modelStore.isLoading"
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
        :error="validation ? validation.$error : false"
        :disable="disable"
        :readonly="disable"
    >
        <template v-slot:before>
            <q-icon :name="icons[modelStore.camelCaseName]" />
        </template>
        <template v-slot:after>
            <q-btn :disable="modelValue == null" round icon="fas fa-pen" @click="editModel" size="sm" />
            <q-btn round icon="fas fa-plus" @click="createModel" size="sm" color="secondary" />
            <component
                :is="modelEditComponent"
                @updated="updatedModel"
                @deleted="deletedModel"
                v-if="modelEditShow"
                @hide="modelEditShow = false"
                :create="create"
            />
        </template>
        <template v-slot:error>
            <template v-for="error of validation.$errors" :key="error.$uid">
                <div v-html="error.$message" class="text-negative"></div>
            </template>
        </template>
    </q-select>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed, defineAsyncComponent, onMounted } from "vue";
    import config from "src/config.json";

    export default {
        // name: 'ComponentName',
        props: {
            modelValue: Number,
            modelStore: Object,
            validation: Object,
            disable: Boolean,
            label: String,
            forcedLabel: Boolean,
            filters: Object,
        },
        emits: ["update:modelValue", "blur"],
        components: {},
        setup(props) {
            const { t } = useI18n();
            const qSelect = ref();
            const modelEditShow = ref(false);
            const modelEditComponent = computed(() => {
                return defineAsyncComponent(() =>
                    import("src/components/models_edit/" + props.modelStore.pascalCaseName + "Edit.vue")
                );
            });
            const create = ref();
            const options = ref();

            onMounted(() => {
                props.modelStore
                    .getIndexDebounce()
                    .then(() => (options.value = props.modelStore.filteredList(props.filters ?? {})));
            });

            return {
                t,
                qSelect,
                modelEditShow,
                modelEditComponent,
                icons: config.icons,
                create,
                options,
                filterFn(val, update) {
                    update(() => {
                        options.value = props.modelStore.filteredList(props.filters ?? {}, val);
                    });
                },
                thisLabel: props.forcedLabel ? props.label : t("select_" + props.modelStore.snakeCaseName),
                createModel() {
                    if (props.validation !== undefined) props.validation.$touch();
                    create.value = true;
                    modelEditShow.value = true;
                },
                editModel() {
                    if (props.validation !== undefined) props.validation.$touch();
                    if (props.validation !== undefined && props.validation.$error) return;
                    props.modelStore.selected = [props.modelStore.list.find(({ id }) => id == props.modelValue)];
                    create.value = false;
                    modelEditShow.value = true;
                },

                updatedModel(model) {
                    qSelect.value.add(model, true);
                    qSelect.value.showPopup();
                    modelEditShow.value = false;
                },
                deletedModel() {
                    qSelect.value.add(null, true);
                    modelEditShow.value = false;
                },
            };
        },
    };
</script>

<template>
    <q-select
        :label="label"
        ref="qSelect"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @filter="filterFn"
        :options="options"
        :loading="modelStore.isLoading"
        emit-value
        map-options
        option-label="displayName"
        option-value="id"
        filled
        multiple
        use-chips
        use-input
        hide-dropdown-icon
        @blur="$emit('blur', $event)"
        :error="validation.$error"
        bottom-slots
    >
        <template v-slot:before>
            <q-icon :name="icons[modelStore.camelCaseName]" />
        </template>
        <template v-slot:after>
            <q-btn round icon="fas fa-plus" @click="createModel" size="sm" color="secondary" />
            <component
                :is="modelEditComponent"
                @updated="updatedModel"
                @deleted="deletedModel"
                v-if="modelEditShow"
                @hide="modelEditShow = false"
                :create="false"
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
            modelValue: Array,
            label: String,
            modelStore: Object,
            validation: Object,
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
            const options = ref();

            onMounted(() =>
                props.modelStore
                    .getIndexDebounce()
                    .then(() => (options.value = props.modelStore.filteredList(props.filters ?? {})))
            );

            return {
                t,
                qSelect,
                modelEditShow,
                modelEditComponent,
                icons: config.icons,
                options,
                filterFn(val, update) {
                    update(() => {
                        options.value = props.modelStore.filteredList(props.filters ?? {}, val);
                    });
                },
                createModel() {
                    props.validation.$touch();
                    if (props.validation.$error) return;
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

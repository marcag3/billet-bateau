<template>
    <q-select
        ref="qSelect"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @blur="$emit('blur', $event)"
        :options="options"
        option-label="displayName"
        option-value="unique_id"
        filled
        use-input
        clearable
        hide-dropdown-icon
        bottom-slots
        :input-debounce="0"
        :error="validation.$error"
    >
        <template v-slot:error>
            <template v-for="error of validation.$errors" :key="error.$uid">
                <div v-html="error.$message" class="text-negative"></div>
            </template>
        </template>
    </q-select>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed, onMounted } from "vue";

    export default {
        // name: 'ComponentName',
        props: {
            modelValue: Object,
            validation: Object,
            models: Array,
        },
        emits: ["update:modelValue", "blur"],
        components: {},
        setup(props) {
            const { t } = useI18n();
            const qSelect = ref();

            onMounted(() => {
                props.models.forEach(({ store }) => store.getIndexDebounce());
            });

            const options = computed(() => {
                let options = [];
                props.models.forEach((modelStore) => {
                    const list = modelStore.store.filteredList(modelStore.filters ?? {});
                    if (list.length === 0) return;
                    options = options
                        .concat([
                            {
                                unique_id: "0_" + list[0].type,
                                displayName: t("select_" + modelStore.store.snakeCaseName),
                                disable: true,
                            },
                        ])
                        .concat(
                            list.map((model) => {
                                model.unique_id = model.id + "_" + model.type;
                                return model;
                            })
                        );
                });

                return options;
            });

            return {
                t,
                qSelect,
                options,
            };
        },
    };
</script>

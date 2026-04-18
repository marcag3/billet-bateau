<template>
    <q-tr :props="props" v-if="display === 'row'">
        <q-td v-for="col of props.cols" :key="col.name" :props="props">
            <component
                v-if="col.condition ? col.condition(props.row) : true"
                :is="col.component"
                v-model.[col.modifier]="props.row[col.name]"
                v-mask="col.v_mask ?? false"
                @blur="touch(col.name)"
                @update:model-value="onChange(col.name)"
                :validation="v$[col.name]"
                v-bind="col.attributes"
                :dense="dense"
                :row="props.row"
            />
        </q-td>
        <q-td>
            <q-btn round icon="fas fa-minus" size="sm" color="negative" @click="$emit('removeRow', props.rowIndex)" />
        </q-td>
    </q-tr>
    <div v-if="display === 'card'" class="q-mt-sm col-xs-12">
        <q-card>
            <q-list>
                <q-item v-for="col of props.cols" :key="col.name" :props="props" class="q-px-none q-py-sm">
                    <component
                        v-if="col.condition ? col.condition(props.row) : true"
                        :is="col.component"
                        :label="col.label ?? t(col.name)"
                        :forcedLabel="!!col.label"
                        v-model.[col.modifier]="props.row[col.name]"
                        v-mask="col.v_mask ?? false"
                        @blur="touch(col.name)"
                        @update:model-value="onChange(col.name)"
                        :icon="col.icon"
                        :validation="v$[col.name]"
                        v-bind="col.attributes"
                        :row="props.row"
                    />
                </q-item>
            </q-list>
        </q-card>
    </div>
</template>

<script>
    import MyInput from "src/components/forms_elements/MyInput";
    import BasicModelSelect from "src/components/forms_elements/BasicModelSelect";
    import MultipleModelSelect from "src/components/forms_elements/MultipleModelSelect";
    import PolymorphicSelect from "src/components/forms_elements/PolymorphicSelect";
    import MyToggle from "src/components/forms_elements/MyToggle";
    import MyBtnToggle from "src/components/forms_elements/MyBtnToggle";
    import MyDateSelect from "src/components/forms_elements/MyDateSelect";
    import MyImage from "src/components/forms_elements/MyImage";
    import MyTimeSelect from "src/components/forms_elements/MyTimeSelect";
    import useVuelidate from "@vuelidate/core";
    import { mask } from "vue-the-mask";
    import { useServerValidations } from "src/store/serverValidations";
    import { computed } from "vue";

    export default {
        // name: 'ComponentName',
        props: {
            props: Object,
            display: String,
            dense: Boolean,
        },
        emits: ["removeRow"],
        directives: {
            mask: {
                beforeMount(el, binding, vnode, oldVnode) {
                    // bind mask directive only if the binding value is true
                    if (binding.value) {
                        mask(el, binding, vnode, oldVnode);
                    }
                },
            },
        },
        components: {
            MyInput,
            BasicModelSelect,
            MultipleModelSelect,
            MyToggle,
            MyDateSelect,
            MyImage,
            MyTimeSelect,
            MyBtnToggle,
            PolymorphicSelect,
        },
        setup(props) {
            const validations = useServerValidations();
            const rules = computed(() => {
                return props.props.cols.reduce((rules, col) => {
                    rules[col.name] = col.rules;
                    return rules;
                }, {});
            });
            const v$ = useVuelidate(
                computed(() => rules),
                props.props.row,
                {
                    $externalResults: computed(() => validations.errors),
                    $lazy: true,
                }
            );
            return {
                rules,
                v$,
                validations,
                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },
                onChange(field) {
                    const col = props.props.cols.find(({ name }) => name === field);
                    if (col.onChange !== undefined) col.onChange(props.props.row);
                },
            };
        },
    };
</script>

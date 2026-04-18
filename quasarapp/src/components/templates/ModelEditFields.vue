<template>
    <q-card-section :class="{ 'q-px-none': $q.screen.lt.sm }" class="q-gutter-md">
        <template v-for="field of fields" :key="field.name">
            <component
                v-if="field.condition ? field.condition() : true"
                :is="field.component"
                v-model.[field.modifier]="model[field.name]"
                v-mask="field.v_mask ?? false"
                :label="field.label ?? t(field.name)"
                :forcedLabel="!!field.label"
                @blur="touch(field.name)"
                @update:model-value="onChange(field.name)"
                :validation="validations[field.name]"
                :icon="field.icon"
                v-bind="field.attributes"
                :dense="dense"
            />
            <template v-if="!!model[field.name] && field.fields">
                <template v-for="field of field.fields" :key="field.name">
                    <component
                        v-if="field.condition ? field.condition() : true"
                        :is="field.component"
                        v-model.[field.modifier]="model[field.name]"
                        v-mask="field.v_mask ?? false"
                        :label="field.label ?? t(field.name)"
                        :forcedLabel="!!field.label"
                        @blur="touch(field.name)"
                        @update:model-value="onChange(field.name)"
                        :validation="validations[field.name]"
                        :icon="field.icon"
                        v-bind="field.attributes"
                        :dense="dense"
                    />
                </template>
            </template>
        </template>
        <slot></slot>
    </q-card-section>
</template>

<script>
    import MyInput from "src/components/forms_elements/MyInput";
    import BasicModelSelect from "src/components/forms_elements/BasicModelSelect";
    import MultipleModelSelect from "src/components/forms_elements/MultipleModelSelect";
    import MyToggle from "src/components/forms_elements/MyToggle";
    import MyBtnToggle from "src/components/forms_elements/MyBtnToggle";
    import MyDateSelect from "src/components/forms_elements/MyDateSelect";
    import MyDateTimeSelect from "src/components/forms_elements/MyDateTimeSelect";
    import MyImage from "src/components/forms_elements/MyImage";
    import MyTimeSelect from "src/components/forms_elements/MyTimeSelect";
    import { mask } from "vue-the-mask";
    import { useI18n } from "vue-i18n";
    import { useServerValidations } from "src/store/serverValidations";

    export default {
        components: {
            MyInput,
            BasicModelSelect,
            MultipleModelSelect,
            MyToggle,
            MyDateSelect,
            MyImage,
            MyTimeSelect,
            MyBtnToggle,
            MyDateTimeSelect,
        },
        props: {
            model: Object,
            fields: Array,
            validations: Object,
            dense: Boolean,
        },
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

        setup(props) {
            const { t } = useI18n();
            const serverValidations = useServerValidations();

            return {
                t,
                touch(fieldName) {
                    props.validations[fieldName].$touch();
                    delete serverValidations.errors[fieldName];
                },
                onChange(fieldName) {
                    const field = props.fields.find(({ name }) => name === fieldName);
                    if (field.onChange !== undefined) field.onChange();
                },
            };
        },
    };
</script>

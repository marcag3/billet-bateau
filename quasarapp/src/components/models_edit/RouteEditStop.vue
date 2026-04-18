<template>
    <RouteEditStopLayout :display="display" :props="props">
        <template v-slot:arrival :props="props">
            <MyInput
                v-model="props.row.arrival_minutes"
                :label="t('arrival')"
                :validation="v$.arrival_minutes"
                type="number"
                icon="fas fa-hourglass"
                :readonly="props.row.stop_sequence == 1"
                @blur="touch('arrival_minutes')"
            />
        </template>
        <template v-slot:stop :props="props">
            <BasicModelSelect
                :model-value="props.row.stop_id"
                @update:model-value="$emit('update:stopList'), (props.row.stop_id = Number($event))"
                :model-store="stops"
                :validation="v$.stop_id"
            />
        </template>
    </RouteEditStopLayout>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import RouteEditStopLayout from "components/models_edit/RouteEditStopLayout";
    import BasicModelSelect from "src/components/forms_elements/BasicModelSelect.vue";
    import { computed } from "vue";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { required, minValue } from "src/utilities/validators";
    import { useStops } from "src/store/stops";
    import MyInput from "src/components/forms_elements/MyInput.vue";

    export default {
        // name: 'ComponentName',
        props: {
            props: Object,
            display: String,
        },

        emits: ["update:modelValue", "update:stopList"],
        components: {
            RouteEditStopLayout,
            BasicModelSelect,
            MyInput,
        },

        setup(props) {
            const { t } = useI18n();
            const stops = useStops();
            const validations = useServerValidations();
            const rules = {
                arrival_minutes: { required, minValue: minValue(0) },
                stop_id: { required },
            };

            const v$ = useVuelidate(rules, props.props.row, {
                $externalResults: computed(() => validations.errors),
                $lazy: true,
            });

            return {
                t,
                v$,
                stops,

                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },
            };
        },
    };
</script>

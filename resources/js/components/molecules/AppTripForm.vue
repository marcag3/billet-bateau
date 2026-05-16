<template>
    <q-form @submit="onValidSubmit">
        <AppFormStack>
            <q-input
                v-model="scheduledDepartureDate"
                v-bind="scheduledDepartureDateProps"
                outlined
                type="date"
                :label="t('tripsList.scheduledDepartureDate')"
                :disable="fieldsDisabled"
            />
            <q-input
                v-model="scheduledDepartureTime"
                v-bind="scheduledDepartureTimeProps"
                outlined
                type="time"
                :label="t('tripsList.scheduledDepartureTime')"
                :disable="fieldsDisabled"
            />
            <AppProductSelectField
                v-model="productId"
                v-bind="productIdProps"
                :program-id="programId"
                :label="t('tripsList.product')"
                :disable="fieldsDisabled"
            />

            <slot
                name="actions"
                :meta="meta"
                :is-submitting="isSubmitting"
                :fields-disabled="fieldsDisabled"
            />
        </AppFormStack>
    </q-form>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
    createTripUpsertFormSchema,
    type TripUpsertFormValues,
} from "../../models/trips/trips.validation";
import { createQuasarFieldBinder } from "../../validation/quasar-vee-fields";
import AppFormStack from "../ui/AppFormStack.vue";
import AppProductSelectField from "../organisms/AppProductSelectField.vue";

const props = defineProps<{
    programId: string;
    /**
     * When set, merges into form values (create prefill may omit time).
     * When null, form resets to empty defaults.
     */
    seed: Partial<TripUpsertFormValues> | null;
    /** Disables fields (e.g. while a delete dialog action runs). */
    disabled?: boolean;
    submitFn: (values: TripUpsertFormValues) => Promise<void>;
}>();

const { t } = useI18n();

const emptyValues = (): TripUpsertFormValues =>
    ({
        scheduledDepartureDate: "",
        scheduledDepartureTime: "",
        productId: "",
    }) as unknown as TripUpsertFormValues;

const tripSchema = createTripUpsertFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, setValues, resetForm } =
    useForm<TripUpsertFormValues>({
        validationSchema: tripSchema,
        initialValues: emptyValues(),
    });

const quasarField = createQuasarFieldBinder(defineField);

const [scheduledDepartureDate, scheduledDepartureDateProps] = quasarField(
    "scheduledDepartureDate",
);
const [scheduledDepartureTime, scheduledDepartureTimeProps] = quasarField(
    "scheduledDepartureTime",
);
const [productId, productIdProps] = quasarField("productId");

const fieldsDisabled = computed(
    () => Boolean(props.disabled) || isSubmitting.value,
);

watch(
    () => props.seed,
    () => {
        if (props.seed != null) {
            setValues({ ...emptyValues(), ...props.seed });
        } else {
            resetForm({ values: emptyValues() });
        }
    },
    { immediate: true },
);

const onValidSubmit = handleSubmit((values) => props.submitFn(values));
</script>

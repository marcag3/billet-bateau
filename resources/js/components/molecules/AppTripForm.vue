<template>
    <q-form @submit="onValidSubmit">
        <AppFormStack>
            <q-input
                v-model="scheduledDepartureAt"
                v-bind="scheduledDepartureAtProps"
                outlined
                type="datetime-local"
                :label="t('tripsList.scheduledDeparture')"
                :disable="fieldsDisabled"
            />
            <q-input
                v-model.number="capacity"
                v-bind="capacityProps"
                outlined
                type="number"
                :label="t('tripsList.capacity')"
                :hint="t('tripsList.capacityHint')"
                :disable="fieldsDisabled"
            />
            <AppBoatTypeSelectField
                v-model="boatTypeId"
                v-bind="boatTypeIdProps"
                :program-id="programId"
                :label="t('tripsList.boatType')"
                :disable="fieldsDisabled"
            />
            <AppWaterRouteSelectField
                v-model="waterRouteId"
                v-bind="waterRouteIdProps"
                :program-id="programId"
                :label="t('tripsList.waterRoute')"
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
import AppBoatTypeSelectField from "../ui/AppBoatTypeSelectField.vue";
import AppWaterRouteSelectField from "../organisms/AppWaterRouteSelectField.vue";

const props = defineProps<{
    programId: string;
    /** When set, replaces form values (e.g. edit mode). When null, form resets to empty defaults. */
    seed: TripUpsertFormValues | null;
    /** Disables fields (e.g. while a delete dialog action runs). */
    disabled?: boolean;
    submitFn: (values: TripUpsertFormValues) => Promise<void>;
}>();

const { t } = useI18n();

const emptyValues = (): TripUpsertFormValues =>
    ({
        scheduledDepartureAt: "",
        capacity: null,
        boatTypeId: null,
        waterRouteId: null,
    }) as unknown as TripUpsertFormValues;

const tripSchema = createTripUpsertFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, setValues, resetForm } =
    useForm<TripUpsertFormValues>({
        validationSchema: tripSchema,
        initialValues: emptyValues(),
    });

const quasarField = createQuasarFieldBinder(defineField);

const [scheduledDepartureAt, scheduledDepartureAtProps] = quasarField(
    "scheduledDepartureAt",
);
const [capacity, capacityProps] = quasarField("capacity");
const [boatTypeId, boatTypeIdProps] = quasarField("boatTypeId");
const [waterRouteId, waterRouteIdProps] = quasarField("waterRouteId");

const fieldsDisabled = computed(
    () => Boolean(props.disabled) || isSubmitting.value,
);

watch(
    () => props.seed,
    (next) => {
        if (next != null) {
            setValues({ ...next });
        } else {
            resetForm({ values: emptyValues() });
        }
    },
    { immediate: true },
);

const onValidSubmit = handleSubmit((values) => props.submitFn(values));
</script>

<template>
    <q-form @submit="onValidSubmit">
        <div class="column q-gutter-y-md">
            <q-input
                v-model="name"
                v-bind="nameProps"
                outlined
                :label="t('guidesList.name')"
                :disable="fieldsDisabled"
            />
            <slot
                name="actions"
                :meta="meta"
                :is-submitting="isSubmitting"
                :fields-disabled="fieldsDisabled"
            />
        </div>
    </q-form>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
    createEmptyGuideFormValues,
    createGuideFormSchema,
    type GuideFormValues,
} from "../../models/guides/guides.validation";
import { createQuasarFieldBinder } from "../../validation/quasar-vee-fields";

const props = defineProps<{
    /**
     * When set, merges into form values (edit prefill).
     * When null, form resets to empty defaults.
     */
    seed: Partial<GuideFormValues> | null;
    disabled?: boolean;
    submitFn: (values: GuideFormValues) => Promise<void>;
}>();

const { t } = useI18n();

const guideFormSchema = computed(() => createGuideFormSchema(t));
const { handleSubmit, defineField, meta, isSubmitting, resetForm } =
    useForm<GuideFormValues>({
        validationSchema: guideFormSchema,
        initialValues: createEmptyGuideFormValues(),
    });

const quasarField = createQuasarFieldBinder(defineField);
const [name, nameProps] = quasarField("name");

const fieldsDisabled = computed(
    () => Boolean(props.disabled) || isSubmitting.value,
);

watch(
    () => props.seed,
    (next) => {
        if (next != null) {
            resetForm({
                values: {
                    ...createEmptyGuideFormValues(),
                    ...next,
                },
            });
        } else {
            resetForm({ values: createEmptyGuideFormValues() });
        }
    },
    { immediate: true },
);

const onValidSubmit = handleSubmit((values) => props.submitFn(values));
</script>

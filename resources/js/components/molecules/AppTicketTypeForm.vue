<template>
    <q-form @submit="onValidSubmit">
        <div class="column q-gutter-y-md">
            <q-input
                v-model="title"
                v-bind="titleProps"
                outlined
                dense
                :label="t('ticketTypesList.typeTitle')"
                :disable="fieldsDisabled"
            />
            <q-input
                :model-value="priceCentsDisplay"
                v-bind="priceCentsProps"
                outlined
                dense
                type="number"
                :label="t('ticketTypesList.priceCents')"
                :hint="t('ticketTypesList.priceCentsHint')"
                :disable="fieldsDisabled"
                @update:model-value="onPriceCentsInput"
            />
            <q-toggle
                v-model="isPayWhatYouCan"
                :label="t('ticketTypesList.payWhatYouCan')"
                :disable="fieldsDisabled"
            />
            <div class="row">
                <div class="col-12 col-sm-6">
                    <q-input
                        v-model.number="minPerPurchase"
                        v-bind="minPerPurchaseProps"
                        outlined
                        dense
                        type="number"
                        :label="t('ticketTypesList.minPerPurchase')"
                        :disable="fieldsDisabled"
                    />
                </div>
                <div class="col-12 col-sm-6">
                    <q-input
                        :model-value="maxPerPurchaseDisplay"
                        v-bind="maxPerPurchaseProps"
                        outlined
                        dense
                        type="number"
                        :label="t('ticketTypesList.maxPerPurchase')"
                        :disable="fieldsDisabled"
                        @update:model-value="onMaxPerPurchaseInput"
                    />
                </div>
            </div>
            <div class="row">
                <div class="col-12 col-sm-6">
                    <q-select
                        v-model="dependsOnTicketTypeId"
                        v-bind="dependsOnTicketTypeIdProps"
                        outlined
                        dense
                        emit-value
                        map-options
                        clearable
                        :options="referenceTicketTypeOptions"
                        option-value="id"
                        option-label="title"
                        :label="t('ticketTypesList.dependsOnTicketType')"
                        :hint="t('ticketTypesList.dependsOnTicketTypeHint')"
                        :disable="fieldsDisabled"
                    />
                </div>
                <div class="col-12 col-sm-6">
                    <q-input
                        :model-value="maxPerReferenceTicketDisplay"
                        v-bind="maxPerReferenceTicketProps"
                        outlined
                        dense
                        type="number"
                        :label="t('ticketTypesList.maxPerReferenceTicket')"
                        :hint="t('ticketTypesList.maxPerReferenceTicketHint')"
                        :disable="fieldsDisabled"
                        @update:model-value="onMaxPerReferenceTicketInput"
                    />
                </div>
            </div>
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
    createEmptyTicketTypeFormValues,
    createTicketTypeFormSchema,
    type TicketTypeFormValues,
} from "../../models/ticket-types/ticket-types.validation";
import { createQuasarFieldBinder } from "../../validation/quasar-vee-fields";
const props = defineProps<{
    /**
     * When set, merges into form values (edit prefill).
     * When null, form resets to empty defaults.
     */
    seed: Partial<TicketTypeFormValues> | null;
    /** Disables fields while submitting or external busy state. */
    disabled?: boolean;
    /** Ticket types available as dependency references (same program). */
    referenceTicketTypeOptions?: Array<{ id: string; title: string }>;
    /** Current ticket type id when editing (excluded from reference options). */
    editingTicketTypeId?: string;
    submitFn: (values: TicketTypeFormValues) => Promise<void>;
}>();

const { t } = useI18n();

const ticketTypeFormSchema = computed(() =>
    createTicketTypeFormSchema(t, {
        editingTicketTypeId: props.editingTicketTypeId ?? null,
    }),
);
const { handleSubmit, defineField, meta, isSubmitting, resetForm, setFieldValue } =
    useForm<TicketTypeFormValues>({
        validationSchema: ticketTypeFormSchema,
        initialValues: createEmptyTicketTypeFormValues(),
    });

const referenceTicketTypeOptions = computed(() => props.referenceTicketTypeOptions ?? []);

const quasarField = createQuasarFieldBinder(defineField);
const [title, titleProps] = quasarField("title");
const [priceCents, priceCentsProps] = quasarField("priceCents");
const [isPayWhatYouCan] = quasarField("isPayWhatYouCan");
const [minPerPurchase, minPerPurchaseProps] = quasarField("minPerPurchase");
const [maxPerPurchase, maxPerPurchaseProps] = quasarField("maxPerPurchase");
const [dependsOnTicketTypeId, dependsOnTicketTypeIdProps] = quasarField("dependsOnTicketTypeId");
const [maxPerReferenceTicket, maxPerReferenceTicketProps] = quasarField("maxPerReferenceTicket");

const fieldsDisabled = computed(
    () => Boolean(props.disabled) || isSubmitting.value,
);

const maxPerPurchaseDisplay = computed(() => {
    const v = maxPerPurchase.value;
    if (v === null || v === undefined) {
        return "";
    }
    return v;
});

const maxPerReferenceTicketDisplay = computed(() => {
    const v = maxPerReferenceTicket.value;
    if (v === null || v === undefined) {
        return "";
    }
    return v;
});

const priceCentsDisplay = computed(() => {
    const v = priceCents.value;
    if (v === null || v === undefined) {
        return "";
    }
    return v;
});

/**
 * @param {unknown} value
 * @returns {void}
 */
function onPriceCentsInput(value: unknown): void {
    if (value === "" || value === null || value === undefined) {
        setFieldValue("priceCents", null);
        return;
    }
    const n =
        typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) {
        setFieldValue("priceCents", null);
        return;
    }
    setFieldValue("priceCents", n);
}

/**
 * @param {unknown} value
 * @returns {void}
 */
function onMaxPerPurchaseInput(value: unknown): void {
    if (value === "" || value === null || value === undefined) {
        setFieldValue("maxPerPurchase", null);
        return;
    }
    const n =
        typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) {
        setFieldValue("maxPerPurchase", null);
        return;
    }
    setFieldValue("maxPerPurchase", n);
}

/**
 * @param {unknown} value
 * @returns {void}
 */
function onMaxPerReferenceTicketInput(value: unknown): void {
    if (value === "" || value === null || value === undefined) {
        setFieldValue("maxPerReferenceTicket", null);
        return;
    }
    const n =
        typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) {
        setFieldValue("maxPerReferenceTicket", null);
        return;
    }
    setFieldValue("maxPerReferenceTicket", n);
}

watch(
    () => props.seed,
    (next) => {
        if (next != null) {
            resetForm({
                values: {
                    ...createEmptyTicketTypeFormValues(),
                    ...next,
                },
            });
        } else {
            resetForm({ values: createEmptyTicketTypeFormValues() });
        }
    },
    { immediate: true },
);

const onValidSubmit = handleSubmit((values) => props.submitFn(values));
</script>

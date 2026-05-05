<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader
                :title="t('ticketTypesList.title')"
                :description="t('ticketTypesList.description')"
            >
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('ticketTypesList.addType')"
                        @click="openCreateDialog"
                    />
                </template>
            </AppPageHeader>
        </template>

        <AppEntityList>
            <AppEmptyListRow
                :show="ticketTypes.length === 0"
                :message="t('ticketTypesList.empty')"
            />
            <q-item
                v-for="row in ticketTypes"
                :key="String(row.id)"
                class="q-pa-md"
            >
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        row.title
                    }}</q-item-label>
                    <q-item-label caption>
                        {{ summaryLine(row) }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <div class="column q-gutter-xs items-end">
                        <q-btn
                            color="primary"
                            outline
                            dense
                            :label="t('ticketTypesList.edit')"
                            @click="() => openEditDialog(row)"
                        />
                        <q-btn
                            flat
                            dense
                            color="negative"
                            icon="delete"
                            :label="t('ticketTypesList.delete')"
                            @click="() => confirmDelete(row)"
                        />
                    </div>
                </q-item-section>
            </q-item>
        </AppEntityList>

        <q-dialog v-model="showFormDialog" persistent>
            <q-card
                class="q-pa-none"
                style="width: min(560px, 92vw); max-width: 100%"
            >
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">
                        {{
                            isEditMode
                                ? t("ticketTypesList.editTitle")
                                : t("ticketTypesList.createTitle")
                        }}
                    </div>
                    <q-space />
                    <q-btn
                        flat
                        round
                        dense
                        icon="close"
                        :aria-label="t('ticketTypesList.cancel')"
                        @click="closeFormDialog"
                    />
                </q-card-section>

                <q-card-section>
                    <q-form @submit.prevent="onFormSubmit">
                        <AppFormStack>
                            <q-input
                                v-model="title"
                                v-bind="titleProps"
                                outlined
                                dense
                                :label="t('ticketTypesList.typeTitle')"
                                :disable="isSubmitting"
                            />
                            <q-input
                                :model-value="priceCentsDisplay"
                                v-bind="priceCentsProps"
                                outlined
                                dense
                                type="number"
                                :label="t('ticketTypesList.priceCents')"
                                :hint="t('ticketTypesList.priceCentsHint')"
                                :disable="isSubmitting"
                                @update:model-value="onPriceCentsInput"
                            />
                            <q-toggle
                                v-model="isPayWhatYouCan"
                                :label="t('ticketTypesList.payWhatYouCan')"
                                :disable="isSubmitting"
                            />
                            <AppFormRow>
                                <div class="col-12 col-sm-6">
                                    <q-input
                                        v-model.number="minPerPurchase"
                                        v-bind="minPerPurchaseProps"
                                        outlined
                                        dense
                                        type="number"
                                        :label="
                                            t('ticketTypesList.minPerPurchase')
                                        "
                                        :disable="isSubmitting"
                                    />
                                </div>
                                <div class="col-12 col-sm-6">
                                    <q-input
                                        :model-value="maxPerPurchaseDisplay"
                                        v-bind="maxPerPurchaseProps"
                                        outlined
                                        dense
                                        type="number"
                                        :label="
                                            t('ticketTypesList.maxPerPurchase')
                                        "
                                        :disable="isSubmitting"
                                        @update:model-value="
                                            onMaxPerPurchaseInput
                                        "
                                    />
                                </div>
                            </AppFormRow>
                            <q-input
                                v-model="tripInventoryCapsJson"
                                v-bind="tripInventoryCapsJsonProps"
                                outlined
                                dense
                                type="textarea"
                                autogrow
                                :label="t('ticketTypesList.tripInventoryCaps')"
                                :hint="
                                    t('ticketTypesList.tripInventoryCapsHint')
                                "
                                :disable="isSubmitting"
                            />
                        </AppFormStack>

                        <div class="row justify-end q-gutter-sm q-mt-md">
                            <q-btn
                                flat
                                :label="t('ticketTypesList.cancel')"
                                :disable="isSubmitting"
                                @click="closeFormDialog"
                            />
                            <q-btn
                                color="primary"
                                type="submit"
                                :loading="isSubmitting"
                                :label="
                                    isEditMode
                                        ? t('ticketTypesList.save')
                                        : t('ticketTypesList.create')
                                "
                                :disable="!meta.valid"
                            />
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { ulid } from "ulid";
import {
    createEmptyTicketTypeFormValues,
    createTicketTypeFormSchema,
    parseTripInventoryCapsJson,
    type TicketTypeFormValues,
} from "../models/ticket-types/ticket-types.validation";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import {
    getTicketTypesCollection,
    getActiveProgramIdRef,
    refreshOutboxSnapshot,
} from "../powersync/app-powersync.runtime";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";
import AppFormRow from "../components/ui/AppFormRow.vue";

const { t, locale } = useI18n();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();

const ticketTypesCollection = getTicketTypesCollection();

const { data: ticketTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = ticketTypesCollection.value;
        const pid = getActiveProgramIdRef().value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ tt: col })
            .where(({ tt }) => eq(tt.program_id, pid));
    },
    [ticketTypesCollection, getActiveProgramIdRef()],
);

const showFormDialog = ref(false);
const editingId = ref("");

const isEditMode = computed(() => editingId.value.trim().length > 0);

const ticketTypeFormSchema = createTicketTypeFormSchema(t);
const {
    handleSubmit,
    defineField,
    meta,
    isSubmitting,
    resetForm,
    setFieldValue,
} = useForm<TicketTypeFormValues>({
    validationSchema: ticketTypeFormSchema,
    initialValues: createEmptyTicketTypeFormValues(),
});

const quasarField = createQuasarFieldBinder(defineField);
const [title, titleProps] = quasarField("title");
const [priceCents, priceCentsProps] = quasarField("priceCents");
const [isPayWhatYouCan] = quasarField("isPayWhatYouCan");
const [minPerPurchase, minPerPurchaseProps] = quasarField("minPerPurchase");
const [maxPerPurchase, maxPerPurchaseProps] = quasarField("maxPerPurchase");
const [tripInventoryCapsJson, tripInventoryCapsJsonProps] = quasarField(
    "tripInventoryCapsJson",
);

const maxPerPurchaseDisplay = computed(() => {
    const v = maxPerPurchase.value;
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
function onPriceCentsInput(value: unknown) {
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
function onMaxPerPurchaseInput(value: unknown) {
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
 * @param {import('../powersync/ticket-types.collection').TicketTypeOutput} row
 * @returns {TicketTypeFormValues}
 */
function rowToFormValues(row): TicketTypeFormValues {
    const capsRaw = row.trip_inventory_caps;
    let capsJson = "";
    if (typeof capsRaw === "string" && capsRaw.trim().length > 0) {
        try {
            capsJson = JSON.stringify(JSON.parse(capsRaw), null, 2);
        } catch {
            capsJson = String(capsRaw);
        }
    } else if (capsRaw !== null && typeof capsRaw === "object") {
        capsJson = JSON.stringify(capsRaw, null, 2);
    }

    const max = row.max_per_purchase;
    const price = row.price_cents;

    return {
        title: String(row.title ?? ""),
        priceCents:
            price === null || price === undefined || price === ""
                ? null
                : Number(price),
        isPayWhatYouCan: row.is_pay_what_you_can === true,
        minPerPurchase: Number(row.min_per_purchase ?? 0),
        maxPerPurchase:
            max === null || max === undefined || max === ""
                ? null
                : Number(max),
        tripInventoryCapsJson: capsJson,
    };
}

/**
 * @param {import('../powersync/ticket-types.collection').TicketTypeOutput} row
 * @returns {string}
 */
function summaryLine(row): string {
    const parts: string[] = [];
    if (row.is_pay_what_you_can === true) {
        parts.push(t("ticketTypesList.summaryPwyc"));
    } else {
        const cents = row.price_cents;
        if (cents != null && cents !== "" && Number.isFinite(Number(cents))) {
            parts.push(
                t("ticketTypesList.summaryPrice", {
                    price: formatPriceCents(cents),
                }),
            );
        } else {
            parts.push("—");
        }
    }
    const min = Number(row.min_per_purchase ?? 0);
    const max = row.max_per_purchase;
    if (max === null || max === undefined || max === "") {
        parts.push(
            t("ticketTypesList.summaryMinMaxUnlimited", { min: String(min) }),
        );
    } else {
        parts.push(
            t("ticketTypesList.summaryMinMax", {
                min: String(min),
                max: String(max),
            }),
        );
    }
    const capN = tripCapsKeyCount(row);
    if (capN > 0) {
        parts.push(t("ticketTypesList.summaryCaps", { count: String(capN) }));
    }
    return parts.join(" · ");
}

/**
 * @param {unknown} cents
 * @returns {string}
 */
function formatPriceCents(cents: unknown): string {
    const n = Number(cents);
    if (!Number.isFinite(n)) {
        return String(cents ?? "");
    }
    return new Intl.NumberFormat(locale.value === "fr" ? "fr-CA" : "en-CA", {
        style: "currency",
        currency: "CAD",
    }).format(n / 100);
}

/**
 * @param {import('../powersync/ticket-types.collection').TicketTypeOutput} row
 * @returns {number}
 */
function tripCapsKeyCount(row): number {
    const raw = row.trip_inventory_caps;
    if (raw == null || raw === "") {
        return 0;
    }
    if (typeof raw === "string") {
        try {
            const parsed: unknown = JSON.parse(raw);
            if (
                parsed !== null &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return Object.keys(parsed as Record<string, unknown>).length;
            }
        } catch {
            return 0;
        }
        return 0;
    }
    if (typeof raw === "object" && !Array.isArray(raw)) {
        return Object.keys(raw as Record<string, unknown>).length;
    }
    return 0;
}

/**
 * @returns {void}
 */
function openCreateDialog() {
    editingId.value = "";
    resetForm({ values: createEmptyTicketTypeFormValues() });
    showFormDialog.value = true;
}

/**
 * @param {import('../powersync/ticket-types.collection').TicketTypeOutput} row
 * @returns {void}
 */
function openEditDialog(row) {
    editingId.value = String(row.id ?? "").trim();
    resetForm({ values: rowToFormValues(row) });
    showFormDialog.value = true;
}

/**
 * @returns {void}
 */
function closeFormDialog() {
    showFormDialog.value = false;
    editingId.value = "";
    resetForm({ values: createEmptyTicketTypeFormValues() });
}

const onFormSubmit = handleSubmit(async (values: TicketTypeFormValues) => {
    const caps = parseTripInventoryCapsJson(values.tripInventoryCapsJson, t);
    const idSnapshot = editingId.value.trim();
    const wasEditing = idSnapshot.length > 0;

    await runWithNotify(
        async () => {
            const col = ticketTypesCollection.value;
            if (!col) throw new Error("Ticket types collection not ready.");
            if (wasEditing) {
                col.update(idSnapshot, (draft) => {
                    draft.title = values.title;
                    draft.price_cents = values.priceCents;
                    draft.is_pay_what_you_can = values.isPayWhatYouCan ? 1 : 0;
                    draft.min_per_purchase = values.minPerPurchase;
                    draft.max_per_purchase = values.maxPerPurchase;
                    draft.trip_inventory_caps = JSON.stringify(caps);
                    draft.updated_at = new Date().toISOString();
                });
                void refreshOutboxSnapshot();
            } else {
                const programId = getActiveProgramIdRef().value.trim();
                if (programId.length === 0) {
                    throw new Error(
                        "Select a program before adding ticket types.",
                    );
                }
                const id = ulid();
                const title = String(values.title ?? "").trim();
                if (title.length === 0) {
                    throw new Error("Ticket type title is required.");
                }
                await col.insert({
                    id,
                    program_id: programId,
                    title,
                    price_cents: values.priceCents,
                    is_pay_what_you_can: values.isPayWhatYouCan ? 1 : 0,
                    min_per_purchase: values.minPerPurchase ?? 0,
                    max_per_purchase: values.maxPerPurchase,
                    trip_inventory_caps: JSON.stringify(caps),
                }).isPersisted.promise;
                void refreshOutboxSnapshot();
            }
            closeFormDialog();
        },
        {
            successMessage: wasEditing
                ? t("ticketTypesList.changesSaved")
                : t("ticketTypesList.created"),
            errorGeneric: t("ticketTypesList.errorGeneric"),
        },
    );
});

/**
 * @param {import('../powersync/ticket-types.collection').TicketTypeOutput} row
 * @returns {void}
 */
function confirmDelete(row) {
    confirm({
        title: t("ticketTypesList.deleteConfirmTitle"),
        message: t("ticketTypesList.deleteConfirmMessage", {
            title: String(row.title ?? ""),
        }),
        onOk: async () => {
            try {
                const col = ticketTypesCollection.value;
                if (!col) return;
                col.delete(String(row.id ?? ""));
                void refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("ticketTypesList.deleted"),
                });
            } catch (e) {
                notifyError(e, t("ticketTypesList.errorGeneric"));
            }
        },
    });
}
</script>

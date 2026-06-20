<template>
    <q-dialog
        v-model="dialogModel"
        persistent
        @hide="onDialogHide"
    >
        <q-card
            class="p-0"
            style="width: min(560px, 92vw); max-width: 100%"
        >
            <q-card-section class="row items-center pb-0">
                <div class="text-h6">
                    {{
                        modalMode === "edit"
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
                    @click="closeModal"
                />
            </q-card-section>

            <q-card-section>
                <AppTicketTypeForm
                    :seed="formSeed"
                    :reference-ticket-type-options="referenceTicketTypeOptions"
                    :editing-ticket-type-id="editingId"
                    :submit-fn="onSubmitTicketType"
                >
                    <template #actions="{ meta, isSubmitting: formSubmitting }">
                        <div class="row justify-end gap-2 mt-4">
                            <q-btn
                                flat
                                :label="t('ticketTypesList.cancel')"
                                :disable="formSubmitting"
                                @click="closeModal"
                            />
                            <q-btn
                                color="primary"
                                type="submit"
                                :loading="formSubmitting"
                                :label="
                                    modalMode === 'edit'
                                        ? t('ticketTypesList.save')
                                        : t('ticketTypesList.create')
                                "
                                :disable="!meta.valid"
                            />
                        </div>
                    </template>
                </AppTicketTypeForm>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ulid } from "ulid";
import AppTicketTypeForm from "../molecules/AppTicketTypeForm.vue";
import type { TicketTypeFormValues } from "../../models/ticket-types/ticket-types.validation";
import type { TicketTypeOutput } from "../../powersync/ticket-types.collection";
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";
import { useNotifyAsyncAction } from "../../composables/useNotifyAsyncAction";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";

const { t } = useI18n();
const powersync = getAppPowerSyncContext();
const { runWithNotify } = useNotifyAsyncAction();

const ticketTypesCollection = powersync.collections.ticket_types;

const { data: ticketTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = ticketTypesCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ tt: col })
            .where(({ tt }) => eq(tt.program_id, pid));
    },
    [ticketTypesCollection, powersync.activeProgramIdRef],
);

const referenceTicketTypeOptions = computed(() => {
    const currentId = editingId.value.trim();
    return (ticketTypes.value ?? [])
        .filter((row) => String(row.id ?? "").trim() !== currentId)
        .map((row) => ({
            id: String(row.id ?? ""),
            title: String(row.title ?? ""),
        }))
        .filter((row) => row.id.length > 0 && row.title.length > 0);
});

const dialogModel = ref(false);
const modalMode = ref<"create" | "edit">("create");
const editingId = ref("");
const formSeed = ref<Partial<TicketTypeFormValues> | null>(null);

/**
 * @param {TicketTypeOutput} row
 * @returns {TicketTypeFormValues}
 */
function rowToFormValues(row: TicketTypeOutput): TicketTypeFormValues {
    const max = row.max_per_purchase;
    const price = row.price_cents;

    return {
        title: String(row.title ?? ""),
        priceCents:
            price === null || price === undefined ? null : Number(price),
        isPayWhatYouCan: row.is_pay_what_you_can === true,
        minPerPurchase: Number(row.min_per_purchase ?? 0),
        maxPerPurchase:
            max === null || max === undefined ? null : Number(max),
        dependsOnTicketTypeId:
            row.depends_on_ticket_type_id === null
            || row.depends_on_ticket_type_id === undefined
            || String(row.depends_on_ticket_type_id).trim() === ""
                ? null
                : String(row.depends_on_ticket_type_id),
        maxPerReferenceTicket:
            row.max_per_reference_ticket === null
            || row.max_per_reference_ticket === undefined
                ? null
                : Number(row.max_per_reference_ticket),
    };
}

/**
 * @returns {void}
 */
function closeModal(): void {
    dialogModel.value = false;
}

/**
 * @returns {void}
 */
function resetModalState(): void {
    modalMode.value = "create";
    editingId.value = "";
    formSeed.value = null;
}

/**
 * @returns {void}
 */
function onDialogHide(): void {
    resetModalState();
}

/**
 * @returns {void}
 */
function openCreateModal(): void {
    modalMode.value = "create";
    editingId.value = "";
    formSeed.value = null;
    dialogModel.value = true;
}

/**
 * @param {TicketTypeOutput} row
 * @returns {void}
 */
function openEditModal(row: TicketTypeOutput): void {
    modalMode.value = "edit";
    editingId.value = String(row.id ?? "").trim();
    formSeed.value = rowToFormValues(row);
    dialogModel.value = true;
}

/**
 * @param {TicketTypeFormValues} values
 * @returns {Promise<void>}
 */
async function onSubmitTicketType(values: TicketTypeFormValues): Promise<void> {
    const idSnapshot = editingId.value.trim();
    const wasEditing = idSnapshot.length > 0;

    await runWithNotify(
        async () => {
            const col = ticketTypesCollection.value;
            if (!col) {
                throw new Error("Ticket types collection not ready.");
            }
            if (wasEditing) {
                col.update(idSnapshot, (draft) => {
                    draft.title = values.title;
                    draft.price_cents = values.priceCents;
                    draft.is_pay_what_you_can = values.isPayWhatYouCan ? 1 : 0;
                    draft.min_per_purchase = values.minPerPurchase;
                    draft.max_per_purchase = values.maxPerPurchase;
                    draft.depends_on_ticket_type_id = values.dependsOnTicketTypeId;
                    draft.max_per_reference_ticket = values.maxPerReferenceTicket;
                });
                void powersync.refreshOutboxSnapshot();
            } else {
                const programId = powersync.activeProgramIdRef.value.trim();
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
                await col
                    .insert({
                        id,
                        program_id: programId,
                        title,
                        price_cents: values.priceCents,
                        is_pay_what_you_can: values.isPayWhatYouCan ? 1 : 0,
                        min_per_purchase: values.minPerPurchase ?? 0,
                        max_per_purchase: values.maxPerPurchase,
                        depends_on_ticket_type_id: values.dependsOnTicketTypeId,
                        max_per_reference_ticket: values.maxPerReferenceTicket,
                    })
                    .isPersisted.promise;
                void powersync.refreshOutboxSnapshot();
            }
            closeModal();
        },
        {
            successMessage: wasEditing
                ? t("ticketTypesList.changesSaved")
                : t("ticketTypesList.created"),
            errorGeneric: t("ticketTypesList.errorGeneric"),
        },
    );
}

defineExpose({
    openCreateModal,
    openEditModal,
});
</script>

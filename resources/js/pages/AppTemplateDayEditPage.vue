<template>
    <AppEntityEditPageLayout
        :title="t('templateDaysList.editPageTitle')"
        :description="t('templateDaysList.editPageDescription')"
        :back-to="backTo"
        :back-label="t('templateDaysList.backToList')"
    >
        <q-banner
            v-if="showNotFound"
            class="bg-warning text-dark q-mb-md"
            rounded
        >
            {{ t("templateDaysList.notFound") }}
            <template #action>
                <q-btn
                    color="primary"
                    flat
                    :label="t('templateDaysList.backToList')"
                    :to="backTo"
                />
            </template>
        </q-banner>

        <template v-if="currentTemplateDay">
            <AppCardSection :label="t('templateDaysList.detailsSection')">
                <q-form @submit.prevent="onSaveNameSubmit">
                    <AppFormStack>
                        <q-input
                            v-model="editName"
                            outlined
                            :label="t('templateDaysList.name')"
                            :disable="isSavingName"
                        />
                        <q-btn
                            color="primary"
                            type="submit"
                            :label="t('templateDaysList.saveChanges')"
                            :loading="isSavingName"
                            :disable="isSavingName"
                            class="self-start"
                        />
                    </AppFormStack>
                </q-form>
            </AppCardSection>

            <AppCardSection :label="t('templateDaysList.slotsSection')">
                <template #label-extra>
                    <q-btn
                        color="primary"
                        icon="add"
                        size="sm"
                        :label="t('templateDaysList.addSlot')"
                        @click="openAddSlotDialog"
                    />
                </template>

                <AppEmptyListRow
                    :show="sortedSlots.length === 0"
                    :message="t('templateDaysList.slotsEmpty')"
                />

                <q-list
                    v-if="sortedSlots.length > 0"
                    separator
                >
                    <q-item
                        v-for="(slot, index) in sortedSlots"
                        :key="String(slot.id)"
                        class="q-pa-md"
                    >
                        <q-item-section>
                            <q-item-label class="text-subtitle1">
                                {{ formatDepartureTime(slot.departure_time) }}
                                <q-badge
                                    v-if="slot.capacity != null"
                                    outline
                                    color="primary"
                                    class="q-ml-sm"
                                >
                                    {{ t('templateDaysList.capacityLabel', { cap: slot.capacity }) }}
                                </q-badge>
                            </q-item-label>
                            <q-item-label
                                caption
                                class="q-mt-xs"
                            >
                                <span class="q-mr-md">
                                    {{
                                        slot.boat_type_id
                                            ? getBoatTypeLabel(slot.boat_type_id)
                                            : t('templateDaysList.anyBoatType')
                                    }}
                                </span>
                                <span class="q-mr-md">
                                    {{
                                        slot.water_route_id
                                            ? getWaterRouteLabel(slot.water_route_id)
                                            : t('templateDaysList.noRoute')
                                    }}
                                </span>
                                <span
                                    v-if="slot.ticket_setup"
                                    class="q-mr-md"
                                >
                                    {{ t('templateDaysList.ticketCustom') }}
                                </span>
                                <span
                                    v-if="slot.internal_notes"
                                    class="q-mr-md"
                                >
                                    <q-icon
                                        name="description"
                                        size="xs"
                                    />
                                    {{ t('templateDaysList.notes') }}
                                </span>
                            </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <div class="row q-gutter-xs items-center">
                                <q-btn
                                    flat
                                    round
                                    dense
                                    icon="arrow_upward"
                                    size="sm"
                                    :disable="index === 0"
                                    :aria-label="t('templateDaysList.moveUp')"
                                    @click="moveSlotUp(slot, index)"
                                />
                                <q-btn
                                    flat
                                    round
                                    dense
                                    icon="arrow_downward"
                                    size="sm"
                                    :disable="index === sortedSlots.length - 1"
                                    :aria-label="t('templateDaysList.moveDown')"
                                    @click="moveSlotDown(slot, index)"
                                />
                                <q-btn
                                    flat
                                    round
                                    dense
                                    icon="edit"
                                    :aria-label="t('templateDaysList.editSlot')"
                                    @click="openEditSlotDialog(slot)"
                                />
                                <q-btn
                                    flat
                                    round
                                    dense
                                    icon="delete"
                                    color="negative"
                                    :disable="isDeletingSlot"
                                    :aria-label="t('templateDaysList.deleteSlot')"
                                    @click="confirmDeleteSlot(slot)"
                                />
                            </div>
                        </q-item-section>
                    </q-item>
                </q-list>
            </AppCardSection>
        </template>
    </AppEntityEditPageLayout>

    <q-dialog
        v-model="slotDialogOpen"
        persistent
    >
        <q-card style="min-width: 480px; max-width: 600px">
            <q-card-section class="q-pb-none">
                <div class="text-h6">
                    {{
                        editingSlotId
                            ? t('templateDaysList.editSlotTitle')
                            : t('templateDaysList.addSlotTitle')
                    }}
                </div>
            </q-card-section>

            <q-card-section>
                <q-form @submit.prevent="onSaveSlotSubmit">
                    <AppFormStack>
                        <q-input
                            v-model="slotForm.departureTime"
                            outlined
                            type="time"
                            :label="t('templateDaysList.departureTime')"
                            :rules="[
                                (val: string) =>
                                    !!val ||
                                    t('templateDaysList.departureTimeRequired'),
                            ]"
                        />

                        <q-input
                            v-model.number="slotForm.capacity"
                            outlined
                            type="number"
                            min="1"
                            :label="t('templateDaysList.capacity')"
                            :rules="[
                                (val: number) =>
                                    (val != null && val >= 1) ||
                                    t('templateDaysList.capacityRequired'),
                            ]"
                        />

                        <q-select
                            v-model="slotForm.boatTypeId"
                            outlined
                            emit-value
                            map-options
                            clearable
                            :options="boatTypeOptions"
                            :label="t('templateDaysList.boatType')"
                            :hint="t('templateDaysList.boatTypeHint')"
                        />

                        <q-select
                            v-model="slotForm.waterRouteId"
                            outlined
                            emit-value
                            map-options
                            clearable
                            :options="waterRouteOptions"
                            :label="t('templateDaysList.waterRoute')"
                            :hint="t('templateDaysList.waterRouteHint')"
                        />

                        <q-card
                            flat
                            bordered
                            class="q-pa-md"
                        >
                            <div class="text-subtitle2 q-mb-sm">
                                {{ t('templateDaysList.ticketSetup') }}
                            </div>

                            <q-option-group
                                v-model="slotForm.ticketPolicy"
                                :options="ticketPolicyOptions"
                                dense
                                inline
                            />

                            <template v-if="slotForm.ticketPolicy === 'custom'">
                                <q-select
                                    v-model="slotForm.allowedTicketTypeIds"
                                    outlined
                                    multiple
                                    use-chips
                                    emit-value
                                    map-options
                                    :options="ticketTypeOptions"
                                    :label="t('templateDaysList.allowedTicketTypes')"
                                    :rules="[
                                        (val: string[]) =>
                                            val.length >= 1 ||
                                            t('templateDaysList.allowedTicketTypesRequired'),
                                    ]"
                                    class="q-mt-md"
                                />

                                <q-input
                                    v-model.number="slotForm.minPerBooking"
                                    outlined
                                    type="number"
                                    min="1"
                                    :label="t('templateDaysList.minPerBooking')"
                                    class="q-mt-sm"
                                />

                                <q-input
                                    v-model.number="slotForm.maxPerBooking"
                                    outlined
                                    type="number"
                                    min="0"
                                    :label="t('templateDaysList.maxPerBooking')"
                                    class="q-mt-sm"
                                    :hint="t('templateDaysList.maxPerBookingHint')"
                                />

                                <q-input
                                    v-model="slotForm.constraintNotes"
                                    outlined
                                    type="textarea"
                                    rows="2"
                                    :label="t('templateDaysList.constraintNotes')"
                                    class="q-mt-sm"
                                />
                            </template>
                        </q-card>

                        <q-input
                            v-model="slotForm.internalNotes"
                            outlined
                            type="textarea"
                            rows="3"
                            :label="t('templateDaysList.internalNotes')"
                            :hint="t('templateDaysList.internalNotesHint')"
                            :maxlength="2000"
                            counter
                        />

                        <div class="row q-gutter-sm justify-end">
                            <q-btn
                                flat
                                :label="t('templateDaysList.cancel')"
                                @click="closeSlotDialog"
                            />
                            <q-btn
                                color="primary"
                                type="submit"
                                :label="
                                    editingSlotId
                                        ? t('templateDaysList.saveSlot')
                                        : t('templateDaysList.addSlot')
                                "
                                :loading="isSavingSlot"
                                :disable="isSavingSlot"
                            />
                        </div>
                    </AppFormStack>
                </q-form>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useRoute } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import {
    getActiveProgramIdRef,
    getAppPowerSyncBootstrappedRef,
    getBoatTypesCollection,
    getTemplateDaySlotsCollection,
    getTemplateDaysCollection,
    getTicketTypesCollection,
    getWaterRoutesCollection,
    refreshOutboxSnapshot,
} from "../powersync/app-powersync.runtime";
import type { TemplateDaySlotOutput } from "../powersync/template-day-slots.collection";
import {
    createTemplateDaySlotRow,
    patchTemplateDaySlotRow,
    deleteTemplateDaySlotRow,
} from "../models/template-day-slots/template-day-slots.model";
import { normalizeTime } from "../utilities/datetime-input";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import AppEntityEditPageLayout from "../layouts/AppEntityEditPageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();

// --- Collections ---

const templateDaysCollection = getTemplateDaysCollection();
const templateDaySlotsCollection = getTemplateDaySlotsCollection();
const boatTypesCollection = getBoatTypesCollection();
const waterRoutesCollection = getWaterRoutesCollection();
const ticketTypesCollection = getTicketTypesCollection();

// --- Route params ---

const programId = computed(() => String(route.params.programId ?? "").trim());
const templateDayId = computed(() =>
    String(route.params.templateDayId ?? "").trim(),
);

const backTo = computed(() => ({
    name: "template-days.list" as const,
    params: { programId: programId.value },
}));

const hasBootstrapped = getAppPowerSyncBootstrappedRef();

// --- Template day query ---

const { data: templateDays } = useLiveQuery(
    (queryBuilder) => {
        const col = templateDaysCollection.value;
        const pid = getActiveProgramIdRef().value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ td: col })
            .where(({ td }) => eq(td.program_id, pid));
    },
    [templateDaysCollection, getActiveProgramIdRef()],
);

const currentTemplateDay = computed(() => {
    const id = templateDayId.value;
    if (id.length === 0) return null;
    return (templateDays.value ?? []).find((td) => String(td.id) === id) ?? null;
});

const showNotFound = computed(
    () =>
        hasBootstrapped.value &&
        templateDayId.value.length > 0 &&
        currentTemplateDay.value == null,
);

// --- Name edit ---

const editName = ref("");
const isSavingName = ref(false);

watch(
    currentTemplateDay,
    (td) => {
        if (td) {
            editName.value = String(td.name ?? "");
        }
    },
    { immediate: true },
);

async function onSaveNameSubmit() {
    const td = currentTemplateDay.value;
    if (!td) return;
    const name = editName.value.trim();
    if (name.length === 0) {
        $q.notify({
            type: "negative",
            message: t("templateDaysList.nameRequired"),
        });
        return;
    }
    isSavingName.value = true;
    await runWithNotify(
        async () => {
            const col = templateDaysCollection.value;
            if (!col) throw new Error("Template days collection not ready.");
            await col
                .update(String(td.id), (draft) => {
                    draft.name = name;
                    draft.updated_at = new Date().toISOString();
                })
                .isPersisted.promise;
            void refreshOutboxSnapshot();
        },
        {
            successMessage: t("templateDaysList.changesSaved"),
            errorGeneric: t("templateDaysList.errorGeneric"),
        },
    );
    isSavingName.value = false;
}

// --- Boat types ---

const { data: boatTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = boatTypesCollection.value;
        const pid = getActiveProgramIdRef().value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ bt: col })
            .where(({ bt }) => eq(bt.program_id, pid));
    },
    [boatTypesCollection, getActiveProgramIdRef()],
);

const boatTypeOptions = computed(() =>
    (boatTypes.value ?? []).map((bt) => ({
        label: String(bt.name ?? ""),
        value: String(bt.id),
    })),
);

function getBoatTypeLabel(id: string | null | undefined): string {
    if (id == null) return "";
    const found = (boatTypes.value ?? []).find(
        (bt) => String(bt.id) === id,
    );
    return found ? String(found.name ?? "") : id;
}

// --- Water routes ---

const { data: waterRoutes } = useLiveQuery(
    (queryBuilder) => {
        const col = waterRoutesCollection.value;
        const pid = getActiveProgramIdRef().value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ wr: col })
            .where(({ wr }) => eq(wr.program_id, pid));
    },
    [waterRoutesCollection, getActiveProgramIdRef()],
);

const waterRouteOptions = computed(() =>
    (waterRoutes.value ?? []).map((wr) => ({
        label: String(wr.name ?? ""),
        value: String(wr.id),
    })),
);

function getWaterRouteLabel(id: string | null | undefined): string {
    if (id == null) return "";
    const found = (waterRoutes.value ?? []).find(
        (wr) => String(wr.id) === id,
    );
    return found ? String(found.name ?? "") : id;
}

// --- Ticket types ---

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

const ticketTypeOptions = computed(() =>
    (ticketTypes.value ?? []).map((tt) => ({
        label: String(tt.title ?? ""),
        value: String(tt.id),
    })),
);

// --- Slots query ---

const { data: slots } = useLiveQuery(
    (queryBuilder) => {
        const col = templateDaySlotsCollection.value;
        const tdid = templateDayId.value;
        if (!col || tdid.length === 0) return undefined;
        return queryBuilder
            .from({ s: col })
            .where(({ s }) => eq(s.template_day_id, tdid));
    },
    [templateDaySlotsCollection, templateDayId],
);

const sortedSlots = computed(() => {
    const list = slots.value ?? [];
    return [...list].sort((a, b) => {
        const aOrder = a.sort_order ?? 0;
        const bOrder = b.sort_order ?? 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aTime = a.departure_time ?? "";
        const bTime = b.departure_time ?? "";
        return aTime.localeCompare(bTime);
    });
});

// --- Slot dialog ---

interface SlotFormState {
    departureTime: string;
    capacity: number | null;
    boatTypeId: string | null;
    waterRouteId: string | null;
    ticketPolicy: "defaults" | "custom";
    allowedTicketTypeIds: string[];
    minPerBooking: number | null;
    maxPerBooking: number | null;
    constraintNotes: string;
    internalNotes: string;
}

function createEmptySlotForm(): SlotFormState {
    return {
        departureTime: "",
        capacity: null,
        boatTypeId: null,
        waterRouteId: null,
        ticketPolicy: "defaults",
        allowedTicketTypeIds: [],
        minPerBooking: 1,
        maxPerBooking: null,
        constraintNotes: "",
        internalNotes: "",
    };
}

const slotDialogOpen = ref(false);
const editingSlotId = ref<string | null>(null);
const slotForm = ref<SlotFormState>(createEmptySlotForm());
const isSavingSlot = ref(false);
const isDeletingSlot = ref(false);

const ticketPolicyOptions = [
    {
        label: t("templateDaysList.ticketPolicyDefaults"),
        value: "defaults",
    },
    {
        label: t("templateDaysList.ticketPolicyCustom"),
        value: "custom",
    },
];

function parseTicketSetup(
    raw: string | null | undefined,
): Pick<
    SlotFormState,
    | "ticketPolicy"
    | "allowedTicketTypeIds"
    | "minPerBooking"
    | "maxPerBooking"
    | "constraintNotes"
> {
    if (raw == null) {
        return {
            ticketPolicy: "defaults",
            allowedTicketTypeIds: [],
            minPerBooking: 1,
            maxPerBooking: null,
            constraintNotes: "",
        };
    }
    try {
        const parsed = JSON.parse(raw) as {
            policy?: "defaults" | "custom";
            allowed_ticket_type_ids?: string[];
            min_per_booking?: number | null;
            max_per_booking?: number | null;
            notes?: string;
        };
        if (parsed.policy === "custom") {
            return {
                ticketPolicy: "custom",
                allowedTicketTypeIds: parsed.allowed_ticket_type_ids ?? [],
                minPerBooking: parsed.min_per_booking ?? 1,
                maxPerBooking: parsed.max_per_booking ?? null,
                constraintNotes: parsed.notes ?? "",
            };
        }
    } catch {
        // ignore parse errors, fall back to defaults
    }
    return {
        ticketPolicy: "defaults",
        allowedTicketTypeIds: [],
        minPerBooking: 1,
        maxPerBooking: null,
        constraintNotes: "",
    };
}

function serializeTicketSetup(
    form: SlotFormState,
): string | null {
    if (form.ticketPolicy !== "custom") {
        return null;
    }
    return JSON.stringify({
        policy: "custom",
        allowed_ticket_type_ids: form.allowedTicketTypeIds,
        min_per_booking: form.minPerBooking ?? 1,
        max_per_booking: form.maxPerBooking ?? null,
        notes: form.constraintNotes.length > 0 ? form.constraintNotes : null,
    });
}

function openAddSlotDialog() {
    editingSlotId.value = null;
    slotForm.value = createEmptySlotForm();
    slotDialogOpen.value = true;
}

function openEditSlotDialog(slot: TemplateDaySlotOutput) {
    editingSlotId.value = String(slot.id);
    const ticketState = parseTicketSetup(slot.ticket_setup);
    slotForm.value = {
        departureTime: slot.departure_time ?? "",
        capacity: slot.capacity ?? null,
        boatTypeId: slot.boat_type_id ?? null,
        waterRouteId: slot.water_route_id ?? null,
        ticketPolicy: ticketState.ticketPolicy,
        allowedTicketTypeIds: ticketState.allowedTicketTypeIds,
        minPerBooking: ticketState.minPerBooking,
        maxPerBooking: ticketState.maxPerBooking,
        constraintNotes: ticketState.constraintNotes,
        internalNotes: slot.internal_notes ?? "",
    };
    slotDialogOpen.value = true;
}

function closeSlotDialog() {
    slotDialogOpen.value = false;
    editingSlotId.value = null;
    slotForm.value = createEmptySlotForm();
}

function getNextSortOrder(): number {
    const list = sortedSlots.value;
    if (list.length === 0) return 0;
    return (list[list.length - 1]?.sort_order ?? 0) + 1;
}

async function onSaveSlotSubmit() {
    const form = slotForm.value;

    // Validate departure time
    if (!form.departureTime) {
        $q.notify({
            type: "negative",
            message: t("templateDaysList.departureTimeRequired"),
        });
        return;
    }

    // Validate capacity
    if (form.capacity == null || form.capacity < 1) {
        $q.notify({
            type: "negative",
            message: t("templateDaysList.capacityRequired"),
        });
        return;
    }

    // Validate custom ticket setup
    if (form.ticketPolicy === "custom") {
        if (form.allowedTicketTypeIds.length === 0) {
            $q.notify({
                type: "negative",
                message: t("templateDaysList.allowedTicketTypesRequired"),
            });
            return;
        }
        if (
            form.maxPerBooking != null &&
            form.minPerBooking != null &&
            form.maxPerBooking < form.minPerBooking
        ) {
            $q.notify({
                type: "negative",
                message: t("templateDaysList.maxGteMin"),
            });
            return;
        }
    }

    const ticketSetupJson = serializeTicketSetup(form);
    const normalizedTime = normalizeTime(form.departureTime);

    isSavingSlot.value = true;
    await runWithNotify(
        async () => {
            if (editingSlotId.value) {
                await patchTemplateDaySlotRow(editingSlotId.value, {
                    departureTime: normalizedTime,
                    capacity: form.capacity ?? 0,
                    boatTypeId: form.boatTypeId,
                    waterRouteId: form.waterRouteId,
                    ticketSetup: ticketSetupJson,
                    internalNotes:
                        form.internalNotes.length > 0
                            ? form.internalNotes
                            : null,
                });
            } else {
                await createTemplateDaySlotRow({
                    templateDayId: templateDayId.value,
                    sortOrder: getNextSortOrder(),
                    departureTime: normalizedTime,
                    capacity: form.capacity ?? 0,
                    boatTypeId: form.boatTypeId,
                    waterRouteId: form.waterRouteId,
                    ticketSetup: ticketSetupJson,
                    internalNotes:
                        form.internalNotes.length > 0
                            ? form.internalNotes
                            : null,
                });
            }
            closeSlotDialog();
        },
        {
            successMessage: editingSlotId.value
                ? t("templateDaysList.slotUpdated")
                : t("templateDaysList.slotCreated"),
            errorGeneric: t("templateDaysList.errorGeneric"),
        },
    );
    isSavingSlot.value = false;
}

function formatDepartureTime(
    raw: string | null | undefined,
): string {
    if (raw == null) return "--:--";
    // Strip seconds if present
    if (raw.length >= 5 && raw[2] === ":") {
        return raw.substring(0, 5);
    }
    return raw;
}

// --- Reorder ---

async function moveSlotUp(
    slot: TemplateDaySlotOutput,
    index: number,
) {
    if (index <= 0) return;
    const above = sortedSlots.value[index - 1];
    if (!above) return;
    const slotOrder = slot.sort_order ?? 0;
    const aboveOrder = above.sort_order ?? 0;
    try {
        await patchTemplateDaySlotRow(String(slot.id), {
            sortOrder: aboveOrder,
        });
        await patchTemplateDaySlotRow(String(above.id), {
            sortOrder: slotOrder,
        });
        void refreshOutboxSnapshot();
    } catch (e) {
        notifyError(e, t("templateDaysList.errorGeneric"));
    }
}

async function moveSlotDown(
    slot: TemplateDaySlotOutput,
    index: number,
) {
    if (index >= sortedSlots.value.length - 1) return;
    const below = sortedSlots.value[index + 1];
    if (!below) return;
    const slotOrder = slot.sort_order ?? 0;
    const belowOrder = below.sort_order ?? 0;
    try {
        await patchTemplateDaySlotRow(String(slot.id), {
            sortOrder: belowOrder,
        });
        await patchTemplateDaySlotRow(String(below.id), {
            sortOrder: slotOrder,
        });
        void refreshOutboxSnapshot();
    } catch (e) {
        notifyError(e, t("templateDaysList.errorGeneric"));
    }
}

// --- Delete slot ---

function confirmDeleteSlot(slot: TemplateDaySlotOutput) {
    if (isDeletingSlot.value) return;
    const time = formatDepartureTime(slot.departure_time);
    confirm({
        title: t("templateDaysList.deleteSlotConfirmTitle"),
        message: t("templateDaysList.deleteSlotConfirmMessage", { time }),
        onOk: async () => {
            isDeletingSlot.value = true;
            try {
                await deleteTemplateDaySlotRow(String(slot.id));
                $q.notify({
                    type: "positive",
                    message: t("templateDaysList.slotDeleted"),
                });
            } catch (e) {
                notifyError(e, t("templateDaysList.errorGeneric"));
            } finally {
                isDeletingSlot.value = false;
            }
        },
    });
}
</script>

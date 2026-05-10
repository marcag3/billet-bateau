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

            <AppCardSection :label="t('templateDaysList.slotCalendarSection')">
                <div class="text-caption text-grey-7 q-mb-sm">
                    {{ t("templateDaysList.slotCalendarHint") }}
                </div>
                <div class="template-day-slot-calendar">
                    <QCalendarDay
                        v-model="slotCalendarDateStr"
                        view="day"
                        bordered
                        no-header
                        :locale="slotCalendarDateLocale"
                        hour24-format
                        interval-minutes="30"
                        interval-count="48"
                        interval-height="22"
                        :use-navigation="false"
                        class="template-day-slot-calendar-surface"
                        @click-time="onSlotCalendarClickTime"
                    >
                        <template #day-body="{ scope }">
                            <div class="template-day-slot-cal-day-body">
                                <div
                                    v-for="ev in slotCalendarEventsForScope(scope)"
                                    :key="ev.id"
                                    class="template-day-slot-cal-event-wrap"
                                    :style="slotEventPositionStyle(scope, ev)"
                                >
                                    <q-btn
                                        dense
                                        no-caps
                                        padding="xs sm"
                                        outline
                                        color="primary"
                                        class="template-day-slot-cal-event-btn full-width text-left"
                                        @click.stop="openEditSlotDialogByEventId(ev.id)"
                                    >
                                        <span class="ellipsis block">{{
                                            ev.title
                                        }}</span>
                                    </q-btn>
                                </div>
                            </div>
                        </template>
                    </QCalendarDay>
                </div>
            </AppCardSection>
        </template>
    </AppEntityEditPageLayout>

    <q-dialog
        v-model="slotDialogOpen"
        persistent
        @show="onSlotDialogShow"
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
                <AppTemplateDaySlotForm
                    ref="templateDaySlotFormRef"
                    v-model="slotForm"
                    :program-id="programId"
                    :editing-slot-id="editingSlotId"
                    :ticket-type-options="ticketTypeOptions"
                    :is-saving-slot="isSavingSlot"
                    :is-deleting-slot="isDeletingSlot"
                    @submit="submitSlotDialog"
                    @cancel="closeSlotDialog"
                    @delete-request="confirmDeleteSlotFromDialog"
                />
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
import { QCalendarDay, today } from "@quasar/quasar-ui-qcalendar";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import type { TemplateDaySlotOutput } from "../powersync/template-day-slots.collection";
import {
    createEmptySlotForm,
    parseTicketSetup,
    serializeTicketSetup,
    type SlotFormState,
} from "../models/template-day-slots/template-day-slot-form";
import {
    createTemplateDaySlotRow,
    deleteTemplateDaySlotRow,
    patchTemplateDaySlotRow,
} from "../models/template-day-slots/template-day-slots.model";
import { normalizeTime } from "../utilities/datetime-input";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import { useProgramBoatTypes } from "../composables/useProgramBoatTypes";
import { useProgramWaterRoutes } from "../composables/useProgramWaterRoutes";
import AppEntityEditPageLayout from "../layouts/AppEntityEditPageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";
import AppTemplateDaySlotForm from "../components/molecules/AppTemplateDaySlotForm.vue";
import {
    isValidCalendarDateYmd,
    isValidTimeHm,
    roundDepartureToNearestMinutes,
} from "../utilities/trip-departure-query";

const powersync = getAppPowerSyncContext();

const { t, locale } = useI18n();
const $q = useQuasar();
const route = useRoute();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();

// --- Collections ---

const templateDaysCollection = powersync.collections.template_days;
const templateDaySlotsCollection = powersync.collections.template_day_slots;
const ticketTypesCollection = powersync.collections.ticket_types;

// --- Route params ---

const programId = computed(() => String(route.params.programId ?? "").trim());
const templateDayId = computed(() =>
    String(route.params.templateDayId ?? "").trim(),
);

const backTo = computed(() => ({
    name: "template-days.list" as const,
    params: { programId: programId.value },
}));

const hasBootstrapped = powersync.hasBootstrappedCollection;

// --- Template day query ---

const { data: templateDays } = useLiveQuery(
    (queryBuilder) => {
        const col = templateDaysCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ td: col })
            .where(({ td }) => eq(td.program_id, pid));
    },
    [templateDaysCollection, powersync.activeProgramIdRef],
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
                })
                .isPersisted.promise;
            void powersync.refreshOutboxSnapshot();
        },
        {
            successMessage: t("templateDaysList.changesSaved"),
            errorGeneric: t("templateDaysList.errorGeneric"),
        },
    );
    isSavingName.value = false;
}

// --- Boat types ---

const { data: boatTypes } = useProgramBoatTypes(programId);

function getBoatTypeLabel(id: string | null | undefined): string {
    if (id == null) return "";
    const found = (boatTypes.value ?? []).find(
        (bt) => String(bt.id) === id,
    );
    return found ? String(found.name ?? "") : id;
}

// --- Water routes ---

const { data: waterRoutes } = useProgramWaterRoutes(programId);

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
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ tt: col })
            .where(({ tt }) => eq(tt.program_id, pid));
    },
    [ticketTypesCollection, powersync.activeProgramIdRef],
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

// --- Slot day calendar (generic local day; only departure times are stored) ---

const slotCalendarDateStr = ref(today());

const slotCalendarDateLocale = computed(() =>
    locale.value === "fr" ? "fr-CA" : "en-CA",
);

/** QCalendar `#day-body` slot scope helpers (see `getScopeForSlot` in QCalendar). */
interface DayBodyScope {
    timestamp: { date: string };
    timeStartPos: (time: string, clamp?: boolean) => number | false;
    timeDurationHeight: (minutes: number) => number;
}

interface SlotCalendarEvent {
    id: string;
    title: string;
    /** Local calendar date `YYYY-MM-DD` (display only). */
    date: string;
    /** `HH:mm` (24h) for QCalendar interval positioning. */
    time: string;
}

function slotDepartureTimeToHm(raw: unknown): string {
    if (raw == null) {
        return "";
    }
    const time = String(raw).trim();
    if (time.length >= 5 && time[2] === ":") {
        return time.slice(0, 5);
    }
    return time;
}

const slotCalendarEvents = computed<SlotCalendarEvent[]>(() => {
    const date = slotCalendarDateStr.value;
    const out: SlotCalendarEvent[] = [];
    for (const slot of sortedSlots.value) {
        const hm = slotDepartureTimeToHm(slot.departure_time);
        if (!isValidTimeHm(hm)) {
            continue;
        }
        out.push({
            id: String(slot.id),
            date,
            time: hm,
            title: buildSlotCalendarTitle(slot),
        });
    }
    return out;
});

function slotCalendarEventsForScope(scope: DayBodyScope): SlotCalendarEvent[] {
    if (scope.timestamp.date !== slotCalendarDateStr.value) {
        return [];
    }
    return slotCalendarEvents.value;
}

function buildSlotCalendarTitle(slot: TemplateDaySlotOutput): string {
    const hm = slotDepartureTimeToHm(slot.departure_time);
    const timeFmt = new Intl.DateTimeFormat(
        slotCalendarDateLocale.value,
        { timeStyle: "short" },
    ).format(new Date(`2000-01-01T${hm}:00`));

    const parts: string[] = [timeFmt];

    const rawCap = slot.capacity;
    const capNum = rawCap == null ? null : Number(rawCap);
    if (capNum != null && !Number.isNaN(capNum)) {
        parts.push(t("templateDaysList.capacityLabel", { cap: capNum }));
    }

    const boat = slot.boat_type_id
        ? getBoatTypeLabel(slot.boat_type_id)
        : "";
    if (boat.trim() !== "") {
        parts.push(boat);
    }

    const route = slot.water_route_id
        ? getWaterRouteLabel(slot.water_route_id)
        : "";
    if (route.trim() !== "") {
        parts.push(route);
    }

    return parts.join(" · ");
}

function slotEventPositionStyle(
    scope: DayBodyScope,
    ev: SlotCalendarEvent,
): Record<string, string> {
    const top = scope.timeStartPos(ev.time, true);
    const topPx = top === false ? 0 : top;
    const slotH = scope.timeDurationHeight(30);
    const minH = Math.max(slotH, 24);
    return {
        position: "absolute",
        left: "2px",
        right: "2px",
        top: `${topPx}px`,
        minHeight: `${minH}px`,
        zIndex: "1",
    };
}

/** QCalendar `click-time` payload (interval cell). */
interface CalendarClickTimePayload {
    scope?: { timestamp?: Record<string, unknown> };
}

function timestampToClickedHm(
    dateYmd: string,
    ts: Record<string, unknown>,
): string | null {
    let timeStr = "";
    if (
        ts.hasTime === true &&
        ts.time != null &&
        String(ts.time).trim() !== ""
    ) {
        const tPart = String(ts.time).trim().slice(0, 5);
        timeStr = isValidTimeHm(tPart) ? tPart : "";
    }
    if (timeStr === "") {
        const h = typeof ts.hour === "number" ? ts.hour : null;
        const m = typeof ts.minute === "number" ? ts.minute : null;
        if (h != null && m != null) {
            const hh = String(Math.max(0, Math.min(23, h))).padStart(2, "0");
            const mm = String(Math.max(0, Math.min(59, m))).padStart(2, "0");
            timeStr = `${hh}:${mm}`;
        }
    }
    if (!isValidTimeHm(timeStr)) {
        return null;
    }

    const rounded = roundDepartureToNearestMinutes(dateYmd, timeStr, 30);
    return rounded?.time ?? null;
}

function onSlotCalendarClickTime(payload: CalendarClickTimePayload): void {
    const rawTs = payload.scope?.timestamp;
    if (rawTs == null || typeof rawTs !== "object") {
        return;
    }
    const dateRaw =
        rawTs.date != null && String(rawTs.date).trim() !== ""
            ? String(rawTs.date).trim()
            : "";
    if (!isValidCalendarDateYmd(dateRaw)) {
        return;
    }
    const hm = timestampToClickedHm(dateRaw, rawTs);
    if (hm == null) {
        return;
    }
    openAddSlotDialog({ departureTime: hm });
}

function openEditSlotDialogByEventId(id: string): void {
    if (id.length === 0) {
        return;
    }
    const slot = sortedSlots.value.find((s) => String(s.id) === id);
    if (slot) {
        openEditSlotDialog(slot);
    }
}

// --- Slot dialog ---

const slotDialogOpen = ref(false);
const editingSlotId = ref<string | null>(null);
const slotForm = ref<SlotFormState>(createEmptySlotForm());
const isSavingSlot = ref(false);
const isDeletingSlot = ref(false);
const templateDaySlotFormRef = ref<{
    prepareAddModeFocus: () => void;
} | null>(null);

function onSlotDialogShow(): void {
    if (editingSlotId.value != null) {
        return;
    }
    templateDaySlotFormRef.value?.prepareAddModeFocus();
}

function openAddSlotDialog(prefill?: { departureTime?: string }): void {
    editingSlotId.value = null;
    const form = createEmptySlotForm();
    const raw = prefill?.departureTime?.trim() ?? "";
    if (raw.length > 0) {
        const hm = raw.length >= 5 ? raw.slice(0, 5) : raw;
        if (isValidTimeHm(hm)) {
            form.departureTime = hm;
        }
    }
    slotForm.value = form;
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

function formatDepartureTimeForConfirm(raw: string): string {
    const v = raw.trim();
    if (v.length >= 5 && v[2] === ":") {
        return v.substring(0, 5);
    }
    return v.length > 0 ? v : "—";
}

function confirmDeleteSlotFromDialog(): void {
    if (isDeletingSlot.value) {
        return;
    }
    const id = editingSlotId.value;
    if (id == null || id.length === 0) {
        return;
    }
    const time = formatDepartureTimeForConfirm(slotForm.value.departureTime);
    confirm({
        title: t("templateDaysList.deleteSlotConfirmTitle"),
        message: t("templateDaysList.deleteSlotConfirmMessage", { time }),
        onOk: async () => {
            isDeletingSlot.value = true;
            try {
                await deleteTemplateDaySlotRow(id);
                closeSlotDialog();
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

function getNextSortOrder(): number {
    const list = sortedSlots.value;
    if (list.length === 0) return 0;
    return (list[list.length - 1]?.sort_order ?? 0) + 1;
}

function cloneSlotFormForAddAnother(form: SlotFormState): SlotFormState {
    return {
        departureTime: "",
        capacity: form.capacity,
        boatTypeId: form.boatTypeId,
        waterRouteId: form.waterRouteId,
        ticketPolicy: form.ticketPolicy,
        allowedTicketTypeIds: [...form.allowedTicketTypeIds],
        minPerBooking: form.minPerBooking,
        maxPerBooking: form.maxPerBooking,
        constraintNotes: form.constraintNotes,
        internalNotes: form.internalNotes,
    };
}

async function submitSlotDialog(closeAfter: boolean): Promise<void> {
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
    const isEdit = editingSlotId.value != null;

    isSavingSlot.value = true;
    await runWithNotify(
        async () => {
            if (isEdit && editingSlotId.value) {
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
                closeSlotDialog();
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
                if (closeAfter) {
                    closeSlotDialog();
                } else {
                    slotForm.value = cloneSlotFormForAddAnother(form);
                    templateDaySlotFormRef.value?.prepareAddModeFocus();
                }
            }
        },
        {
            successMessage: isEdit
                ? t("templateDaysList.slotUpdated")
                : t("templateDaysList.slotCreated"),
            errorGeneric: t("templateDaysList.errorGeneric"),
        },
    );
    isSavingSlot.value = false;
}
</script>

<style scoped>
.template-day-slot-calendar {
    min-height: 32rem;
}

.template-day-slot-calendar-surface {
    border-radius: 4px;
    overflow: hidden;
}

.template-day-slot-calendar-surface :deep(.q-calendar-day__day-interval),
.template-day-slot-calendar-surface
    :deep(.q-calendar-day__day-interval--section) {
    cursor: pointer;
}

.template-day-slot-cal-day-body {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.template-day-slot-cal-event-wrap {
    pointer-events: auto;
}

.template-day-slot-cal-event-btn {
    font-size: 0.75rem;
}
</style>

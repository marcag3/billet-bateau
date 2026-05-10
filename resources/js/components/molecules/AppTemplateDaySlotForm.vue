<template>
    <q-form @submit.prevent="onFormSubmit">
        <AppFormStack>
            <q-input
                ref="slotDepartureTimeInputRef"
                :model-value="modelValue.departureTime"
                outlined
                lazy-rules
                type="time"
                :label="t('templateDaysList.departureTime')"
                :rules="[
                    (val: string) =>
                        !!val || t('templateDaysList.departureTimeRequired'),
                ]"
                @update:model-value="
                    patchModel({ departureTime: String($event ?? '') })
                "
            />

            <q-input
                :model-value="modelValue.capacity"
                outlined
                type="number"
                min="1"
                :label="t('templateDaysList.capacity')"
                :rules="[
                    (val: number) =>
                        (val != null && val >= 1) ||
                        t('templateDaysList.capacityRequired'),
                ]"
                @update:model-value="
                    patchModel({
                        capacity:
                            $event === '' || $event === null
                                ? null
                                : Number($event),
                    })
                "
            />

            <AppBoatTypeSelectField
                :model-value="modelValue.boatTypeId"
                :program-id="programId"
                :label="t('templateDaysList.boatType')"
                :hint="t('templateDaysList.boatTypeHint')"
                @update:model-value="patchModel({ boatTypeId: $event })"
            />

            <AppWaterRouteSelectField
                :model-value="modelValue.waterRouteId"
                :program-id="programId"
                :label="t('templateDaysList.waterRoute')"
                :hint="t('templateDaysList.waterRouteHint')"
                @update:model-value="patchModel({ waterRouteId: $event })"
            />

            <q-card
                flat
                bordered
                class="q-pa-md"
            >
                <div class="text-subtitle2 q-mb-sm">
                    {{ t("templateDaysList.ticketSetup") }}
                </div>

                <q-option-group
                    :model-value="modelValue.ticketPolicy"
                    :options="ticketPolicyOptions"
                    dense
                    inline
                    @update:model-value="patchModel({ ticketPolicy: $event })"
                />

                <template v-if="modelValue.ticketPolicy === 'custom'">
                    <q-select
                        :model-value="modelValue.allowedTicketTypeIds"
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
                        @update:model-value="
                            patchModel({ allowedTicketTypeIds: $event })
                        "
                    />

                    <q-input
                        :model-value="modelValue.minPerBooking"
                        outlined
                        type="number"
                        min="1"
                        :label="t('templateDaysList.minPerBooking')"
                        class="q-mt-sm"
                        @update:model-value="
                            patchModel({
                                minPerBooking:
                                    $event === '' || $event === null
                                        ? null
                                        : Number($event),
                            })
                        "
                    />

                    <q-input
                        :model-value="modelValue.maxPerBooking"
                        outlined
                        type="number"
                        min="0"
                        :label="t('templateDaysList.maxPerBooking')"
                        class="q-mt-sm"
                        :hint="t('templateDaysList.maxPerBookingHint')"
                        @update:model-value="
                            patchModel({
                                maxPerBooking:
                                    $event === '' || $event === null
                                        ? null
                                        : Number($event),
                            })
                        "
                    />

                    <q-input
                        :model-value="modelValue.constraintNotes"
                        outlined
                        type="textarea"
                        rows="2"
                        :label="t('templateDaysList.constraintNotes')"
                        class="q-mt-sm"
                        @update:model-value="
                            patchModel({
                                constraintNotes: String($event ?? ''),
                            })
                        "
                    />
                </template>
            </q-card>

            <q-input
                :model-value="modelValue.internalNotes"
                outlined
                type="textarea"
                rows="3"
                :label="t('templateDaysList.internalNotes')"
                :hint="t('templateDaysList.internalNotesHint')"
                :maxlength="2000"
                counter
                @update:model-value="
                    patchModel({ internalNotes: String($event ?? '') })
                "
            />

            <div class="row q-gutter-sm items-center full-width">
                <q-btn
                    v-if="editingSlotId"
                    flat
                    no-caps
                    color="negative"
                    :label="t('templateDaysList.deleteSlot')"
                    :loading="isDeletingSlot"
                    :disable="isSavingSlot || isDeletingSlot"
                    @click="emit('delete-request')"
                />
                <q-space />
                <q-btn
                    flat
                    :label="t('templateDaysList.cancel')"
                    :disable="isDeletingSlot"
                    @click="emit('cancel')"
                />
                <q-btn
                    v-if="!editingSlotId"
                    flat
                    color="primary"
                    type="button"
                    :label="t('templateDaysList.addSlot')"
                    :loading="isSavingSlot"
                    :disable="isSavingSlot || isDeletingSlot"
                    @click="emit('submit', true)"
                />
                <q-btn
                    color="primary"
                    type="submit"
                    :label="
                        editingSlotId
                            ? t('templateDaysList.saveSlot')
                            : t('templateDaysList.addSlotAndAnother')
                    "
                    :loading="isSavingSlot"
                    :disable="isSavingSlot || isDeletingSlot"
                />
            </div>
        </AppFormStack>
    </q-form>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { SlotFormState } from "../../models/template-day-slots/template-day-slot-form";
import AppFormStack from "../ui/AppFormStack.vue";
import AppBoatTypeSelectField from "../ui/AppBoatTypeSelectField.vue";
import AppWaterRouteSelectField from "../organisms/AppWaterRouteSelectField.vue";

const props = defineProps<{
    modelValue: SlotFormState;
    programId: string;
    editingSlotId: string | null;
    ticketTypeOptions: { label: string; value: string }[];
    isSavingSlot: boolean;
    isDeletingSlot: boolean;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: SlotFormState];
    submit: [closeAfter: boolean];
    cancel: [];
    "delete-request": [];
}>();

const { t } = useI18n();

const ticketPolicyOptions = computed(() => [
    {
        label: t("templateDaysList.ticketPolicyDefaults"),
        value: "defaults" as const,
    },
    {
        label: t("templateDaysList.ticketPolicyCustom"),
        value: "custom" as const,
    },
]);

function patchModel(partial: Partial<SlotFormState>): void {
    emit("update:modelValue", { ...props.modelValue, ...partial });
}

function onFormSubmit(): void {
    emit("submit", props.editingSlotId != null);
}

const slotDepartureTimeInputRef = ref<{
    focus: () => void;
    resetValidation: () => void;
} | null>(null);

function prepareAddModeFocus(): void {
    void nextTick(() => {
        slotDepartureTimeInputRef.value?.resetValidation();
        slotDepartureTimeInputRef.value?.focus();
    });
}

defineExpose({
    prepareAddModeFocus,
});
</script>

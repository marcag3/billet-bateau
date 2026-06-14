<template>
    <q-dialog
        v-model="dialogModel"
        persistent
        maximized
        transition-show="slide-up"
        transition-hide="slide-down"
    >
        <q-card class="column" style="max-width: 42rem; width: 100%; max-height: 100vh">
            <q-card-section class="row items-start q-pb-none">
                <div class="col">
                    <div class="text-h6">{{ modalTitle }}</div>
                    <div
                        v-if="modalDescription.length > 0"
                        class="text-body2 text-grey-8 q-mt-xs"
                    >
                        {{ modalDescription }}
                    </div>
                </div>
                <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    :aria-label="t('common.dismiss')"
                    @click="closeModal"
                />
            </q-card-section>

            <q-card-section class="col scroll">
                <q-banner
                    v-if="showNotFound"
                    class="bg-warning text-dark q-mb-md"
                    rounded
                >
                    {{ t("tripsList.notFound") }}
                </q-banner>

                <template
                    v-if="
                        !showNotFound &&
                            modalMode === 'edit' &&
                            currentTrip &&
                            tripSwitcherOptions.length > 0
                    "
                >
                    <AppCardSection :label="t('tripsList.quickNavLabel')">
                        <div class="row q-col-gutter-sm items-center">
                            <div class="col-12 col-sm-auto">
                                <q-btn
                                    flat
                                    round
                                    dense
                                    icon="chevron_left"
                                    :aria-label="t('tripsList.previousTrip')"
                                    :disable="!neighbors.prev"
                                    @click="goPrev"
                                />
                            </div>
                            <q-select
                                class="col-12 col-sm"
                                :model-value="editTripId"
                                :options="tripSwitcherOptions"
                                emit-value
                                map-options
                                dense
                                outlined
                                :label="t('tripsList.scheduledDeparture')"
                                @update:model-value="onSwitchTrip"
                            />
                            <div class="col-12 col-sm-auto">
                                <q-btn
                                    flat
                                    round
                                    dense
                                    icon="chevron_right"
                                    :aria-label="t('tripsList.nextTrip')"
                                    :disable="!neighbors.next"
                                    @click="goNext"
                                />
                            </div>
                            <div
                                v-if="neighbors.total > 0 && neighbors.index >= 0"
                                class="col-12 text-caption text-grey-8"
                            >
                                {{
                                    t("tripsList.positionInList", {
                                        index: neighbors.index + 1,
                                        total: neighbors.total,
                                    })
                                }}
                            </div>
                        </div>
                    </AppCardSection>
                </template>

                <div
                    v-if="
                        !showNotFound &&
                            modalMode === 'edit' &&
                            !currentTrip
                    "
                    class="flex flex-center q-pa-xl"
                >
                    <q-spinner color="primary" size="2.5em" />
                </div>

                <AppCardSection
                    v-if="modalMode === 'create'"
                    :label="t('tripsList.addNew')"
                >
                    <AppTripForm
                        :program-id="programId"
                        :seed="tripCreateSeed"
                        :submit-fn="submitCreateTrip"
                    >
                        <template #actions="{ meta, isSubmitting }">
                            <q-btn
                                color="primary"
                                type="submit"
                                :label="t('tripsList.create')"
                                :loading="isSubmitting"
                                :disable="
                                    !meta.valid ||
                                    isSubmitting ||
                                    programId.length === 0
                                "
                                class="self-start"
                            />
                        </template>
                    </AppTripForm>
                </AppCardSection>

                <AppCardSection
                    v-if="modalMode === 'edit' && currentTrip"
                    :label="t('tripsList.editSection')"
                >
                    <AppTripForm
                        :program-id="programId"
                        :seed="tripFormSeed"
                        :disabled="isDeleting"
                        :submit-fn="submitUpdateTrip"
                    >
                        <template
                            #actions="{ meta, isSubmitting, fieldsDisabled }"
                        >
                            <div class="row q-gutter-sm">
                                <q-btn
                                    color="primary"
                                    type="submit"
                                    :label="t('tripsList.saveChanges')"
                                    :loading="isSubmitting"
                                    :disable="!meta.valid || fieldsDisabled"
                                />
                                <q-btn
                                    flat
                                    color="negative"
                                    icon="delete"
                                    :label="t('tripsList.delete')"
                                    :disable="isSubmitting || isDeleting"
                                    @click="confirmDelete"
                                />
                            </div>
                        </template>
                    </AppTripForm>
                </AppCardSection>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
    useTripModalUpsert,
    type TripModalBaseRouteName,
} from "../../composables/useTripModalUpsert";
import AppCardSection from "../ui/AppCardSection.vue";
import AppTripForm from "../molecules/AppTripForm.vue";

const props = defineProps<{
    routeName: TripModalBaseRouteName;
}>();

const { t } = useI18n();

const {
    programId,
    modalMode,
    dialogModel,
    closeModal,
    openCreateModal,
    openEditModal,
    editTripId,
    tripCreateSeed,
    tripFormSeed,
    currentTrip,
    neighbors,
    tripSwitcherOptions,
    onSwitchTrip,
    goPrev,
    goNext,
    showNotFound,
    isDeleting,
    submitCreateTrip,
    submitUpdateTrip,
    confirmDelete,
    modalTitle,
    modalDescription,
} = useTripModalUpsert(props.routeName);

defineExpose({
    openCreateModal,
    openEditModal,
});
</script>

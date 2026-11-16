<template>
    <q-banner v-if="showNotFound" class="bg-warning text-dark mb-4" rounded>
        {{ t('programsControlAdmin.bookingNotFound') }}
    </q-banner>

    <template v-else-if="currentBooking">
        <q-banner v-if="isCancelled" class="bg-negative text-white mb-4" rounded>
            {{
                isCancelledByTrip
                    ? t('programsControlAdmin.bookingCancelledByTripBanner')
                    : t('programsControlAdmin.bookingCancelledBanner')
            }}
            <template v-if="canRestoreBooking" #action>
                <q-btn
                    flat
                    color="white"
                    :label="t('programsControlAdmin.restoreBooking')"
                    :loading="isRestoring"
                    @click="confirmRestoreBooking"
                />
            </template>
        </q-banner>

        <AppCardSection :label="t('programsControlAdmin.bookingDetails')">
            <q-form @submit.prevent="onSaveSubmit">
                <div class="column gap-4">
                    <q-select
                        v-model="tripId"
                        v-bind="tripIdProps"
                        outlined
                        emit-value
                        map-options
                        :options="tripOptions"
                        :label="t('programsControlAdmin.trip')"
                        :disable="isSubmitting || isDeleting || hasCheckIn"
                    />
                    <q-input
                        v-model="contactName"
                        v-bind="contactNameProps"
                        outlined
                        :label="t('publicBooking.contactName')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <q-input
                        v-model="contactEmail"
                        v-bind="contactEmailProps"
                        outlined
                        type="email"
                        :label="t('publicBooking.contactEmail')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <q-input
                        v-model="contactPhone"
                        v-bind="contactPhoneProps"
                        outlined
                        type="tel"
                        :label="t('publicBooking.contactPhone')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <AppBookingCustomQuestionsFields
                        v-if="bookingQuestions.length > 0"
                        v-model:answers="customAnswers"
                        :questions="bookingQuestions"
                        :errors="customAnswerErrors"
                        :disabled="isSubmitting || isDeleting"
                    />
                    <div class="row gap-2">
                        <q-btn
                            color="primary"
                            type="submit"
                            :label="t('programsControlAdmin.saveBooking')"
                            :loading="isSubmitting"
                            :disable="!canSaveBooking"
                        />
                        <q-btn
                            v-if="canCancelBooking"
                            flat
                            color="negative"
                            :label="t('programsControlAdmin.cancelBooking')"
                            :loading="isCancelling"
                            :disable="isSubmitting || isDeleting"
                            @click="confirmCancelBooking"
                        />
                        <q-btn
                            v-if="canDeleteBooking"
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('common.delete')"
                            :disable="isSubmitting || isDeleting || isCancelling"
                            @click="confirmDeleteBooking"
                        />
                    </div>
                </div>
            </q-form>
        </AppCardSection>

        <AppCardSection :label="t('programsControlAdmin.ticketsSection')">
            <AppEmptyListRow
                :show="tickets.length === 0"
                :message="t('programsControlAdmin.noTickets')"
            />
            <q-list v-if="tickets.length > 0" separator class="q-mb-md">
                <q-item v-for="ticket in tickets" :key="String(ticket.id)">
                    <q-item-section>
                        <q-item-label>{{ ticket.name ?? '—' }}</q-item-label>
                        <q-item-label caption>{{ ticket.email ?? '—' }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <div class="row gap-1">
                            <q-btn
                                flat
                                dense
                                color="primary"
                                :label="t('common.edit')"
                                @click="() => openEditTicket(ticket)"
                            />
                            <q-btn
                                flat
                                dense
                                color="negative"
                                icon="delete"
                                :disable="hasCheckIn"
                                @click="() => confirmDeleteTicket(ticket)"
                            />
                        </div>
                    </q-item-section>
                </q-item>
            </q-list>

            <q-form v-if="!hasCheckIn && !isCancelled" @submit.prevent="onAddTicketSubmit">
                <div class="text-subtitle2 q-mb-sm">{{ t('programsControlAdmin.addTicket') }}</div>
                <div class="column gap-4">
                    <q-select
                        v-model="newTicketTypeId"
                        outlined
                        emit-value
                        map-options
                        :options="ticketTypeOptions"
                        :label="t('programsControl.ticketType')"
                    />
                    <q-input
                        v-model="newTicketName"
                        outlined
                        :label="t('programsControl.passengerName')"
                    />
                    <q-input
                        v-model="newTicketEmail"
                        outlined
                        type="email"
                        :label="t('publicBooking.contactEmail')"
                    />
                    <AppCountrySelect
                        v-model="newTicketCountry"
                        :label="t('publicBooking.country')"
                    />
                    <q-btn
                        color="primary"
                        outline
                        type="submit"
                        :label="t('programsControlAdmin.addTicket')"
                        :disable="!canAddTicket"
                        class="self-start"
                    />
                </div>
            </q-form>
        </AppCardSection>

        <AppCardSection :label="t('programsControlAdmin.checkInSection')">
            <div class="text-body2 q-mb-sm">
                {{
                    hasCheckIn
                        ? t('programsControlAdmin.checkedIn')
                        : t('programsControlAdmin.notCheckedIn')
                }}
            </div>
            <q-btn
                v-if="hasCheckIn"
                flat
                color="primary"
                :label="t('programsControl.undoCheckIn')"
                @click="onUndoCheckIn"
            />
        </AppCardSection>
    </template>

    <AppBookingTicketEditDialog
        v-model="editTicketDialogOpen"
        v-model:ticket-type-id="editTicketTypeId"
        v-model:name="editTicketName"
        v-model:email="editTicketEmail"
        v-model:country="editTicketCountry"
        :ticket-type-options="ticketTypeOptions"
        @submit="onSaveTicketEdit"
    />
</template>

<script setup lang="ts">
import AppCardSection from '../ui/AppCardSection.vue';
import AppEmptyListRow from '../ui/AppEmptyListRow.vue';
import AppCountrySelect from '../molecules/AppCountrySelect.vue';
import AppBookingCustomQuestionsFields from '../molecules/AppBookingCustomQuestionsFields.vue';
import AppBookingTicketEditDialog from '../molecules/AppBookingTicketEditDialog.vue';
import { useControlBookingEditForm } from '../../composables/useControlBookingEditForm';

const props = defineProps<{
    bookingId: string;
}>();

const emit = defineEmits<{
    deleted: [];
}>();

const {
    t,
    currentBooking,
    showNotFound,
    isCancelled,
    isCancelledByTrip,
    canRestoreBooking,
    isRestoring,
    confirmRestoreBooking,
    tripId,
    tripIdProps,
    tripOptions,
    contactName,
    contactNameProps,
    contactEmail,
    contactEmailProps,
    contactPhone,
    contactPhoneProps,
    bookingQuestions,
    customAnswers,
    customAnswerErrors,
    isSubmitting,
    isDeleting,
    isCancelling,
    hasCheckIn,
    canSaveBooking,
    canCancelBooking,
    canDeleteBooking,
    onSaveSubmit,
    confirmCancelBooking,
    confirmDeleteBooking,
    tickets,
    openEditTicket,
    confirmDeleteTicket,
    newTicketTypeId,
    newTicketName,
    newTicketEmail,
    newTicketCountry,
    ticketTypeOptions,
    canAddTicket,
    onAddTicketSubmit,
    onUndoCheckIn,
    editTicketDialogOpen,
    editTicketTypeId,
    editTicketName,
    editTicketEmail,
    editTicketCountry,
    onSaveTicketEdit,
} = useControlBookingEditForm(() => props.bookingId, () => emit('deleted'));
</script>

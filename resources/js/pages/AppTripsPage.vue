<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader :title="t('tripsCalendar.title')">
                <template #actions>
                    <q-btn color="primary" icon="add" :label="t('tripsList.addTrip')"
                        @click="tripModalRef?.openCreateModal()" />
                </template>
            </AppPageHeader>
        </template>

        <div class="trips-calendar-toolbar row items-center no-wrap mb-2 gap-1 pb-2 border-b border-black/12">
            <template v-if="tripsViewMode !== 'list'">
                <q-btn flat round dense icon="chevron_left" :aria-label="t('tripsCalendar.prev')"
                    :disable="!canCalendarPrev" @click="calendarPrev" />
                <q-btn flat dense no-caps :label="t('tripsCalendar.goToday')" @click="calendarToday" />
                <q-btn flat round dense icon="chevron_right" :aria-label="t('tripsCalendar.next')"
                    :disable="!canCalendarNext" @click="calendarNext" />
                <div class="col text-center text-subtitle1 text-weight-medium ellipsis">
                    {{ calendarTitle }}
                </div>
            </template>
            <div v-else class="col" />
            <q-btn-toggle v-model="tripsViewMode" no-caps unelevated toggle-color="primary" color="grey-3"
                text-color="grey-8" :options="viewToggleOptions" />
        </div>

        <AppEntityList v-if="tripsViewMode === 'list'">
            <AppEmptyListRow :show="trips.length === 0" :message="t('tripsList.empty')" />
            <q-item
                v-for="tr in trips"
                :key="String(tr.id)"
                clickable
                class="p-4"
                @click="tripModalRef?.openEditModal(String(tr.id))"
            >
                <q-item-section v-if="tripListProductImageUrl(tr).length > 0" avatar>
                    <q-avatar rounded size="48px">
                        <q-img :src="tripListProductImageUrl(tr)" ratio="1" fit="cover"
                            :alt="t('productsList.image')" />
                    </q-avatar>
                </q-item-section>
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        productDisplayName(tr)
                        }}</q-item-label>
                    <q-item-label caption>
                        {{ t("tripsList.scheduledDeparture") }}:
                        {{ formatDeparture(tr) }}
                        <template v-if="tr.capacity != null">
                            · {{ t("tripsList.capacity") }}: {{ tr.capacity }}
                        </template>
                        <template v-if="tr.boatTypeName">
                            · {{ t("tripsList.boatType") }}:
                            {{ tr.boatTypeName }}
                        </template>
                        <template v-if="tr.waterRouteName">
                            · {{ t("tripsList.waterRoute") }}:
                            {{ tr.waterRouteName }}
                        </template>
                    </q-item-label>
                </q-item-section>
            </q-item>
        </AppEntityList>

        <div v-if="tripsViewMode !== 'list'" class="min-h-[32rem]">
            <QCalendarDay v-if="tripsViewMode !== 'month'" ref="dayCalendarRef" v-model="selectedDateStr"
                :view="tripsViewMode === 'day' ? 'day' : 'week'" bordered :locale="dateLocale"
                :weekdays="calendarWeekdays" hour24-format interval-minutes="30" interval-count="48"
                interval-height="22" date-header="stacked" column-header-after :use-navigation="false"
                class="rounded overflow-hidden [&_.q-calendar-day__day-interval]:cursor-pointer [&_.q-calendar-day__day-interval--section]:cursor-pointer [&_.q-calendar-month__day]:cursor-pointer [&_.q-calendar-month__day.disabled]:cursor-default" @click-time="onDayCalendarClickTime">
                <template #column-header-after="{ scope }">
                    <div v-if="isValidServiceDateYmd(scope.timestamp.date)"
                        class="w-full px-1 pb-1">
                        <AppTripsCalendarDayHeaderActions :disabled="programId.length === 0"
                            :template-days="templateDayMenuOptions" @apply="
                                onApplyTemplateDay($event, scope.timestamp.date)
                                " @clear-unbooked="
                                confirmClearUnbookedForDay(scope.timestamp.date)
                                " />
                    </div>
                </template>
                <template #day-body="{ scope }">
                    <div class="absolute inset-0 pointer-events-none">
                        <div v-for="ev in eventsForDay(scope.timestamp.date)" :key="ev.id"
                            class="pointer-events-auto overflow-hidden flex flex-col"
                            :style="eventPositionStyle(scope, ev)">
                            <q-btn dense no-caps padding="xs sm" outline color="primary"
                                class="text-xs flex-1 min-h-0 w-full text-left items-start"
                                @click.stop="onTripClick(ev.id)">
                                <span class="ellipsis block">{{ ev.title }}</span>
                            </q-btn>
                        </div>
                    </div>
                </template>
            </QCalendarDay>

            <QCalendarMonth v-else ref="monthCalendarRef" v-model="selectedDateStr" bordered :locale="dateLocale"
                :weekdays="calendarWeekdays" :use-navigation="false" class="rounded overflow-hidden [&_.q-calendar-day__day-interval]:cursor-pointer [&_.q-calendar-day__day-interval--section]:cursor-pointer [&_.q-calendar-month__day]:cursor-pointer [&_.q-calendar-month__day.disabled]:cursor-default"
                @click-day="onMonthCalendarClickDay">
                <template #day="{ scope }">
                    <div v-if="!scope.outside" class="min-h-12 max-h-[6.5rem] overflow-auto column gap-1 p-1">
                        <q-btn v-for="ev in eventsForDay(scope.timestamp.date)" :key="ev.id" dense no-caps size="sm"
                            outline color="primary" class="text-[0.7rem] full-width text-left"
                            @click.stop="onTripClick(ev.id)">
                            <span class="ellipsis block">{{ ev.title }}</span>
                        </q-btn>
                    </div>
                </template>
            </QCalendarMonth>
        </div>
        <AppTripUpsertModal ref="tripModalRef" route-name="trips" />
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { QCalendarDay, QCalendarMonth } from "@quasar/quasar-ui-qcalendar";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppTripUpsertModal from "../components/organisms/AppTripUpsertModal.vue";
import AppTripsCalendarDayHeaderActions from "../components/molecules/AppTripsCalendarDayHeaderActions.vue";
import { useTripsCalendar } from "../composables/useTripsCalendar";

interface QCalendarNavExpose {
    prev: (amount?: number) => void;
    next: (amount?: number) => void;
    moveToToday: () => void;
}

const tripModalRef = ref<InstanceType<typeof AppTripUpsertModal> | null>(null);
const dayCalendarRef = ref<QCalendarNavExpose | null>(null);
const monthCalendarRef = ref<QCalendarNavExpose | null>(null);

const {
    t,
    programId,
    trips,
    templateDayMenuOptions,
    dateLocale,
    calendarWeekdays,
    tripsViewMode,
    selectedDateStr,
    viewToggleOptions,
    calendarTitle,
    canCalendarPrev,
    canCalendarNext,
    calendarPrev,
    calendarNext,
    calendarToday,
    productDisplayName,
    tripListProductImageUrl,
    formatDeparture,
    eventsForDay,
    eventPositionStyle,
    isValidServiceDateYmd,
    onApplyTemplateDay,
    confirmClearUnbookedForDay,
    onTripClick,
    onDayCalendarClickTime,
    onMonthCalendarClickDay,
} = useTripsCalendar(tripModalRef);
</script>

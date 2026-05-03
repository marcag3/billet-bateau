<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader
                :title="t('boatsList.title')"
                :description="t('boatsList.description')"
            >
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('boatsList.addBoat')"
                        :to="{ name: 'boats.create', params: { programId } }"
                    />
                </template>
            </AppPageHeader>
        </template>

        <template #filters>
            <AppCardSection :label="t('boatsList.filters')">
                <AppFormRow>
                    <q-input
                        v-model="filterName"
                        class="col-12 col-sm-6 col-md-3"
                        outlined
                        dense
                        clearable
                        :label="t('boatsList.filterName')"
                    />
                    <q-input
                        v-model="filterCapacity"
                        class="col-12 col-sm-6 col-md-2"
                        outlined
                        dense
                        clearable
                        :label="t('boatsList.filterCapacity')"
                    />
                    <q-input
                        v-model="filterNotes"
                        class="col-12 col-sm-6 col-md-3"
                        outlined
                        dense
                        clearable
                        :label="t('boatsList.filterNotes')"
                    />
                    <q-select
                        v-model="filterBoatTypeId"
                        class="col-12 col-sm-6 col-md-3"
                        outlined
                        dense
                        clearable
                        emit-value
                        map-options
                        :options="boatTypeOptions"
                        :label="t('boatsList.filterBoatType')"
                    />
                    <div class="col-12 col-md-1 flex items-end">
                        <q-btn
                            flat
                            color="primary"
                            :label="t('boatsList.clearFilters')"
                            :disable="!hasActiveFilters"
                            @click="clearFilters"
                        />
                    </div>
                </AppFormRow>
            </AppCardSection>
        </template>

        <AppAlertBanner
            v-if="hasOutboxCommitError"
            variant="warning"
            dismissible
            :dismiss-label="t('common.dismiss')"
            @dismiss="dismissOutboxCommitError"
        >
            {{ outboxCommitError }}
        </AppAlertBanner>

        <AppBootstrapGate
            :ready="hasBootstrapped"
            content-class="q-gutter-y-md"
        >
            <AppCardSection :label="t('boatsList.listProgramRoster')">
                <p class="text-body2 text-grey-8 q-mb-none">
                    {{ t('boatsList.rosterForProgram', { name: selectedProgramName }) }}
                </p>
            </AppCardSection>

            <q-infinite-scroll
                :offset="400"
                :disable="infiniteScrollDisabled"
                @load="onLoadMore"
            >
                <AppEntityList>
                    <AppEmptyListRow
                        :show="filteredBoats.length === 0"
                        :message="emptyListMessage"
                    />
                    <q-item
                        v-for="b in visibleBoats"
                        :key="String(b.id)"
                        class="q-pa-md"
                    >
                        <q-item-section>
                            <q-item-label class="text-h6">{{ b.name }}</q-item-label>
                        <q-item-label
                            v-if="b.notes"
                            caption
                            lines="2"
                        >
                            {{ b.notes }}
                        </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <div class="row q-gutter-y-xs items-end" style="flex-direction: column">
                            <q-item-label
                                v-if="b.capacity != null"
                                class="text-body2"
                            >
                                {{ t('boatsList.capacity') }}: {{ b.capacity }}
                            </q-item-label>
                            <q-item-label
                                v-if="(b as any).boatTypeName"
                                class="text-body2"
                            >
                                {{ t('boatsList.boatType') }}: {{ (b as any).boatTypeName }}
                            </q-item-label>
                                <q-btn
                                    color="primary"
                                    outline
                                    dense
                                    :label="t('boatsList.edit')"
                                    :to="{
                                        name: 'boats.edit',
                                        params: { programId, boatId: String(b.id) },
                                    }"
                                />
                            </div>
                        </q-item-section>
                    </q-item>
                </AppEntityList>
                <template #loading>
                    <div class="row justify-center q-my-md">
                        <q-spinner-dots
                            color="primary"
                            size="40px"
                        />
                    </div>
                </template>
            </q-infinite-scroll>
        </AppBootstrapGate>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { getAppPowerSyncBootstrappedRef, useAppPowerSyncOutbox, getProgramsCollection, getBoatTypesCollection, getBoatsCollection, getActiveProgramIdRef } from '../powersync/app-powersync.runtime';
import { joinBoatsWithBoatTypes } from '../powersync/joined-queries';
import AppEntityIndexPageLayout from '../layouts/AppEntityIndexPageLayout.vue';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppBootstrapGate from '../components/ui/AppBootstrapGate.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppFormRow from '../components/ui/AppFormRow.vue';
import AppEntityList from '../components/ui/AppEntityList.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';

const PAGE_SIZE = 20;

const { t } = useI18n();
const route = useRoute();
const boatsCollection = getBoatsCollection();
const boatTypesCollection = getBoatTypesCollection();
const activeProgramIdRef = getActiveProgramIdRef();

const { data: allBoats } = useLiveQuery(
    (queryBuilder) => {
        const col = boatsCollection.value;
        const btCol = boatTypesCollection.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || !btCol || pid.length === 0) return undefined;
        return joinBoatsWithBoatTypes(queryBuilder, col, btCol)
            .where(({ b }: any) => eq(b.program_id, pid))
            .orderBy(({ b }: any) => b.updated_at, 'desc')
            .orderBy(({ b }: any) => b.created_at, 'desc')
            .orderBy(({ b }: any) => b.id, 'desc');
    },
    [boatsCollection, boatTypesCollection, activeProgramIdRef],
);
const boats = computed(() => {
    return allBoats.value ?? [];
});
const programsCollection = getProgramsCollection();

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ p: col });
    },
    [programsCollection],
);

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const programId = computed(() => String(route.params.programId ?? '').trim());

// O(1) program name lookup via Map instead of O(n) .find()
const programNameById = computed(() => {
    const map = new Map<string, string>();
    for (const p of programs.value) {
        if (p != null && p.id) {
            map.set(String(p.id), String(p.name ?? p.id));
        }
    }
    return map;
});

const selectedProgramName = computed(() => {
    const id = programId.value;
    if (id.length === 0) return '';
    return programNameById.value.get(id) ?? id;
});

const filterName = ref('');
const filterCapacity = ref('');
const filterNotes = ref('');
const filterBoatTypeId = ref<string | null>(null);

const visibleCount = ref(PAGE_SIZE);

// Scoped boat types query for the filter dropdown (all types in program, not just those with boats)
const scopedBoatTypesCollection = getBoatTypesCollection();
const { data: scopedBoatTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = scopedBoatTypesCollection.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ bt: col })
            .where(({ bt }) => eq(bt.program_id, pid));
    },
    [scopedBoatTypesCollection, activeProgramIdRef],
);

const boatTypeOptions = computed(() =>
    (scopedBoatTypes.value ?? []).map((bt) => ({
        label: String(bt.name ?? ''),
        value: String(bt.id),
    })),
);

const hasActiveFilters = computed(() => {
    return (
        filterName.value.trim().length > 0 ||
        filterCapacity.value.trim().length > 0 ||
        filterNotes.value.trim().length > 0 ||
        (filterBoatTypeId.value != null && String(filterBoatTypeId.value).length > 0)
    );
});

const filteredBoats = computed(() => {
    const nq = filterName.value.trim().toLowerCase();
    const capq = filterCapacity.value.trim();
    const notesq = filterNotes.value.trim().toLowerCase();
    const typeId = filterBoatTypeId.value;

    return boats.value.filter((b) => {
        const name = String(b.name ?? '').toLowerCase();
        const notes = String(b.notes ?? '').toLowerCase();
        const cap = b.capacity == null ? '' : String(b.capacity);

        if (nq.length > 0 && !name.includes(nq)) {
            return false;
        }
        if (notesq.length > 0 && !notes.includes(notesq)) {
            return false;
        }
        if (capq.length > 0 && !cap.includes(capq)) {
            return false;
        }
        if (typeId != null && String(typeId).length > 0) {
            const bid = b.boat_type_id == null || String(b.boat_type_id) === '' ? null : String(b.boat_type_id);
            if (bid !== String(typeId)) {
                return false;
            }
        }
        return true;
    });
});

const visibleBoats = computed(() => filteredBoats.value.slice(0, visibleCount.value));

const infiniteScrollDisabled = computed(
    () => visibleBoats.value.length >= filteredBoats.value.length,
);

const emptyListMessage = computed(() => {
    if (filteredBoats.value.length > 0) {
        return '';
    }
    if (boats.value.length > 0 && hasActiveFilters.value) {
        return t('boatsList.emptyFiltered');
    }
    return t('boatsList.empty');
});

function clearFilters() {
    filterName.value = '';
    filterCapacity.value = '';
    filterNotes.value = '';
    filterBoatTypeId.value = null;
}

watch(
    () => [filterName.value, filterCapacity.value, filterNotes.value, filterBoatTypeId.value],
    () => {
        visibleCount.value = PAGE_SIZE;
    },
);

watch(
    () => filteredBoats.value.length,
    (len) => {
        if (len < visibleCount.value) {
            visibleCount.value = Math.max(PAGE_SIZE, len);
        }
    },
);

function onLoadMore(_index: number, done: (stop?: boolean) => void) {
    if (visibleBoats.value.length >= filteredBoats.value.length) {
        done(true);
        return;
    }
    visibleCount.value += PAGE_SIZE;
    const stop = visibleBoats.value.length >= filteredBoats.value.length;
    done(stop);
}


</script>

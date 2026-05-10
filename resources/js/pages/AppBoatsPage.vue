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

        <q-infinite-scroll
            :offset="400"
            :disable="infiniteScrollDisabled"
            @load="onLoadMore"
        >
            <AppEntityList>
                <AppEmptyListRow
                    :show="boats.length === 0"
                    :message="emptyListMessage"
                />
                <q-item
                    v-for="b in visibleBoats"
                    :key="String(b.id)"
                    class="q-pa-md"
                >
                    <q-item-section>
                        <q-item-label class="text-h6">{{
                            b.name
                        }}</q-item-label>
                        <q-item-label v-if="b.notes" caption lines="2">
                            {{ b.notes }}
                        </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <div
                            class="row q-gutter-y-xs items-end"
                            style="flex-direction: column"
                        >
                            <q-item-label
                                v-if="b.capacity != null"
                                class="text-body2"
                            >
                                {{ t("boatsList.capacity") }}: {{ b.capacity }}
                            </q-item-label>
                            <q-item-label
                                v-if="(b as any).boatTypeName"
                                class="text-body2"
                            >
                                {{ t("boatsList.boatType") }}:
                                {{ (b as any).boatTypeName }}
                            </q-item-label>
                            <q-btn
                                color="primary"
                                outline
                                dense
                                :label="t('common.edit')"
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
                    <q-spinner-dots color="primary" size="40px" />
                </div>
            </template>
        </q-infinite-scroll>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import { joinBoatsWithBoatTypes } from "../powersync/joined-queries";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const PAGE_SIZE = 20;

const { t } = useI18n();
const route = useRoute();
const boatsCollection = powersync.collections.boats;
const boatTypesCollection = powersync.collections.boat_types;
const activeProgramIdRef = powersync.activeProgramIdRef;

const { data: allBoats } = useLiveQuery(
    (queryBuilder) => {
        const col = boatsCollection.value;
        const btCol = boatTypesCollection.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || !btCol || pid.length === 0) return undefined;
        return joinBoatsWithBoatTypes(queryBuilder, col, btCol)
            .where(({ b }: Record<string, Record<string, unknown>>) =>
                eq(b.program_id, pid),
            )
            .orderBy(
                ({ b }: Record<string, Record<string, unknown>>) => b.id,
                "desc",
            );
    },
    [boatsCollection, boatTypesCollection, activeProgramIdRef],
);
const boats = computed(() => {
    return allBoats.value ?? [];
});

const programId = computed(() => String(route.params.programId ?? "").trim());

const visibleCount = ref(PAGE_SIZE);
const visibleBoats = computed(() => boats.value.slice(0, visibleCount.value));

const infiniteScrollDisabled = computed(
    () => visibleBoats.value.length >= boats.value.length,
);

const emptyListMessage = computed(() => t("boatsList.empty"));

watch(
    () => boats.value.length,
    (len) => {
        if (len < visibleCount.value) {
            visibleCount.value = Math.max(PAGE_SIZE, len);
        }
    },
);

function onLoadMore(_index: number, done: (stop?: boolean) => void) {
    if (visibleBoats.value.length >= boats.value.length) {
        done(true);
        return;
    }
    visibleCount.value += PAGE_SIZE;
    const stop = visibleBoats.value.length >= boats.value.length;
    done(stop);
}
</script>

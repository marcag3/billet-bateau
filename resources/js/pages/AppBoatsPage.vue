<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader :title="t('boatsList.title')">
                <template #actions>
                    <q-btn color="primary" icon="add" :label="t('boatsList.addBoat')"
                        :to="{ name: 'boats.create', params: { programId } }" />
                </template>
            </AppPageHeader>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <AppEmptyListRow class="col-span-full" :show="boats.length === 0" :message="t('boatsList.empty')" />
            <div v-for="b in boats" :key="String(b.id)">
                <q-card class="boat-card cursor-pointer full-height column relative-position" role="button" tabindex="0"
                    :aria-label="`${t('common.edit')}: ${boatDisplayTitle(b)}`" @click="goEdit(b)"
                    @keydown.enter.prevent="goEdit(b)" @keydown.space.prevent="goEdit(b)">
                    <q-img :src="boatTypeBannerUrl(b)" :style="boatBannerPlaceholderStyle(b)" fit="cover" ratio="1"
                        spinner-color="primary" class="boat-card__img rounded-borders" :alt="boatDisplayTitle(b)">
                        <div class="absolute-bottom">
                            <div class="text-h6">{{ boatDisplayTitle(b) }}</div>
                            <div v-if="boatTypeSubtitle(b)" class="text-subtitle2">
                                {{ boatTypeSubtitle(b) }}
                            </div>
                        </div>
                    </q-img>
                    <div class="boat-card__hint absolute-full flex flex-center text-white text-body1 text-weight-medium text-center px-4"
                        aria-hidden="true">
                        {{ t("common.edit") }}
                    </div>
                </q-card>
            </div>
        </div>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { joinBoatsWithBoatTypes } from "../powersync/joined-queries";
import { mediaObjectPublicUrl } from "../utilities/media-url";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
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

const boats = computed(() => allBoats.value ?? []);

const programId = computed(() => String(route.params.programId ?? "").trim());

function boatDisplayTitle(b: Record<string, unknown>): string {
    const n = b.name;
    if (n == null || String(n).trim().length === 0) {
        return "Untitled";
    }
    return String(n).trim();
}

function boatTypeBannerUrl(b: Record<string, unknown>): string | undefined {
    const key = b.boatTypeBannerObjectKey;
    const url = mediaObjectPublicUrl(
        key == null || key === "" ? null : String(key),
    );
    return url.length > 0 ? url : undefined;
}

/** Background when there is no boat type banner (same idea as programs list). */
function boatBannerPlaceholderStyle(b: Record<string, unknown>) {
    if (boatTypeBannerUrl(b) != null) {
        return {};
    }
    return { background: "#e0e0e0" };
}

function boatTypeSubtitle(b: Record<string, unknown>): string {
    const raw = b.boatTypeName;
    if (raw == null) {
        return "";
    }
    return String(raw).trim();
}

function goEdit(b: Record<string, unknown>): void {
    void router.push({
        name: "boats.edit",
        params: {
            programId: programId.value,
            boatId: String(b.id),
        },
    });
}
</script>

<style scoped>
.boat-card__img :deep(.q-img__content) {
    min-height: 200px;
}

.boat-card__hint {
    opacity: 0;
    transition: opacity 0.2s ease;
    background: rgba(0, 0, 0, 0.45);
    pointer-events: none;
    z-index: 600;
}

.boat-card:hover .boat-card__hint,
.boat-card:focus-visible .boat-card__hint {
    opacity: 1;
}

.boat-card:focus-visible {
    outline: 2px solid var(--q-primary);
    outline-offset: 2px;
}
</style>

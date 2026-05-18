<template>
    <q-page class="">
        <AppPageHeader :title="t('programsList.title')">
            <template #actions>
                <q-btn
                    color="secondary"
                    icon="add"
                    :label="t('programsList.addProgram')"
                    :to="{ name: 'programs.create' }"
                />
            </template>
        </AppPageHeader>

        <AppBootstrapGate
            :ready="hasBootstrapped"
            :loading-title="t('programsList.loadingLocal')"
            :loading-subcopy="t('programsList.loadingLocalHint')"
            :error-message="powersyncErrorMessage"
        >
            <q-tabs
                v-model="programTab"
                class="q-mb-md"
                active-color="primary"
                align="left"
                dense
                no-caps
            >
                <q-tab name="active" :label="t('programsList.tabActive')" />
                <q-tab name="archived" :label="t('programsList.tabArchived')" />
            </q-tabs>

            <div class="row q-col-gutter-md">
                <template v-if="isProgramsInitialLoadPending">
                    <div class="col-12">
                        <q-banner rounded class="bg-grey-2 text-body2">
                            <template #avatar>
                                <q-spinner color="primary" size="sm" />
                            </template>
                            <div class="text-weight-medium">
                                {{ t("programsList.loadingPrograms") }}
                            </div>
                            <div class="text-caption text-grey-8">
                                {{ t("programsList.loadingProgramsHint") }}
                            </div>
                        </q-banner>
                    </div>
                    <div
                        v-for="i in 3"
                        :key="`prog-skel-${i}`"
                        class="col-12 col-sm-6 col-md-4"
                    >
                        <q-card >
                            <q-skeleton height="160px" square />
                            <q-card-section>
                                <q-skeleton type="text" class="text-subtitle1" />
                                <q-skeleton type="text" width="60%" />
                            </q-card-section>
                        </q-card>
                    </div>
                </template>
                <template v-else>
                    <AppEmptyListRow
                        class="col-12"
                        :show="showProgramsEmptyState"
                        :message="emptyListMessage"
                    />
                    <div
                        v-for="program in filteredPrograms"
                        :key="String(program.id)"
                        class="col-12 col-sm-6 col-md-4"
                    >
                        <q-card>
                            <q-img
                                :src="primaryImageFor(program)"
                                :style="placeholderStyle(program)"
                                :ratio="16 / 9"
                            >
                                <div class="absolute-bottom">
                                    <div class="text-h6">{{ program.name }}</div>
                                    <div
                                        class="text-subtitle2"
                                        v-if="programDescription(program)"
                                    >
                                        {{ programDescription(program) }}
                                    </div>
                                </div>
                            </q-img>

                            <q-card-section class="col-grow">
                                <div
                                    v-if="addressDisplayLines(program).length"
                                    class="row no-wrap items-start text-body2 text-grey-7 q-gutter-sm"
                                >
                                    <q-icon
                                        name="place"
                                        size="sm"
                                        class="q-pt-xs"
                                    />
                                    <div>
                                        <div
                                            v-for="(line, i) in addressDisplayLines(
                                                program,
                                            )"
                                            :key="`addr-${String(program.id)}-${i}`"
                                        >
                                            {{ line }}
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-caption text-grey-6">
                                    {{ t("programsList.noAddress") }}
                                </div>
                            </q-card-section>
                            <q-separator />
                            <q-card-actions align="evenly">
                                <q-btn
                                    icon="edit"
                                    color="secondary"
                                    flat
                                    no-caps
                                    :label="t('programsList.editProgram')"
                                    :to="{
                                        name: 'programs.edit',
                                        params: { programId: String(program.id) },
                                    }"
                                />
                                <q-btn
                                    icon="dashboard"
                                    color="secondary"
                                    flat
                                    no-caps
                                    :label="t('programsList.controlPanel')"
                                    :to="{
                                        name: 'programs.control',
                                        params: { programId: String(program.id) },
                                    }"
                                />
                                <q-btn
                                    icon="confirmation_number"
                                    color="secondary"
                                    flat
                                    no-caps
                                    :label="t('programsList.checkinManager')"
                                    :to="{
                                        name: 'programs.checkin',
                                        params: { programId: String(program.id) },
                                    }"
                                />
                            </q-card-actions>
                        </q-card>
                    </div>
                </template>
            </div>
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useLiveQuery } from "@tanstack/vue-db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import type { ProgramOutput } from "../powersync/programs.collection";
import { mediaObjectPublicUrl } from "../utilities/media-url";
import { isProgramArchivedByEndDateYmd } from "../utilities/program-helpers";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";
import { usePageLayout } from "../composables/usePageLayout";
import {
    isProgramsInitialLoadPending as computeProgramsInitialLoadPending,
    shouldShowProgramsEmptyState as computeShowProgramsEmptyState,
} from "../utilities/programs-first-run-loading";

const { t } = useI18n();

usePageLayout({ documentTitleKey: "programsList.title" });

const programsCollection = powersync.collections.programs;
const hasBootstrapped = powersync.hasBootstrappedCollection;
const initialUserScopeSyncComplete = powersync.initialUserScopeSyncComplete;
const powersyncErrorMessage = powersync.errorMessage;

const { data: programs, isLoading: programsQueryLoading } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder
            .from({ p: col })
            .orderBy(({ p }) => p.id, "desc");
    },
    [programsCollection],
);

const programTab = ref<"active" | "archived">("active");

const totalProgramCount = computed(() => (programs.value ?? []).length);

const filteredPrograms = computed((): ProgramOutput[] => {
    const list = programs.value ?? [];
    if (programTab.value === "active") {
        return list.filter(
            (p) =>
                p != null &&
                !isProgramArchivedByEndDateYmd(
                    typeof p.end_date === "string" ? p.end_date : undefined,
                ),
        ) as unknown as ProgramOutput[];
    }
    return list.filter(
        (p) =>
            p != null &&
            isProgramArchivedByEndDateYmd(
                typeof p.end_date === "string" ? p.end_date : undefined,
            ),
    ) as unknown as ProgramOutput[];
});

const isProgramsInitialLoadPending = computed(() =>
    computeProgramsInitialLoadPending(
        hasBootstrapped.value,
        initialUserScopeSyncComplete.value,
        programsQueryLoading.value,
    ),
);

const showProgramsEmptyState = computed(() =>
    computeShowProgramsEmptyState(
        hasBootstrapped.value,
        filteredPrograms.value.length,
        initialUserScopeSyncComplete.value,
        programsQueryLoading.value,
    ),
);

const emptyListMessage = computed(() => {
    if (totalProgramCount.value === 0) {
        return t("programsList.empty");
    }
    if (programTab.value === "active") {
        return t("programsList.emptyActive");
    }
    return t("programsList.emptyArchived");
});

function programDescription(p: ProgramOutput): string {
    const d = p.description;
    if (d == null) {
        return "";
    }
    const s = String(d).trim();

    return s;
}

function addressDisplayLines(p: ProgramOutput): string[] {
    const lines: string[] = [];
    const l1 = p.line_1 != null ? String(p.line_1).trim() : "";
    const l2 = p.line_2 != null ? String(p.line_2).trim() : "";
    if (l1.length > 0) {
        lines.push(l1);
    }
    if (l2.length > 0) {
        lines.push(l2);
    }
    const city = p.city != null ? String(p.city).trim() : "";
    const pc = p.postal_code != null ? String(p.postal_code).trim() : "";
    const cityLine = [city, pc].filter((x) => x.length > 0).join(", ");
    if (cityLine.length > 0) {
        lines.push(cityLine);
    }
    const country = p.country != null ? String(p.country).trim() : "";
    if (country.length > 0) {
        lines.push(country);
    }

    return lines;
}

function primaryImageFor(p: ProgramOutput): string | undefined {
    const fromKey = mediaObjectPublicUrl(p.banner_object_key);
    if (fromKey.length > 0) {
        return fromKey;
    }

    return undefined;
}

function placeholderStyle(p: ProgramOutput) {
    const hex =
        typeof p.theme_color === "string" ? p.theme_color.trim() : "#e0e0e0";
    return { background: hex || "#e0e0e0" };
}
</script>

<style scoped></style>

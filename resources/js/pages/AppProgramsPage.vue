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

        <AppAlertBanner
            v-if="hasOutboxCommitError"
            variant="warning"
            dismissible
            :dismiss-label="t('common.dismiss')"
            @dismiss="dismissOutboxCommitError"
        >
            {{ outboxCommitError }}
        </AppAlertBanner>

        <AppBootstrapGate :ready="hasBootstrapped">
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
                <AppEmptyListRow
                    class="col-12"
                    :show="filteredPrograms.length === 0"
                    :message="emptyListMessage"
                />
                <div
                    v-for="p in filteredPrograms"
                    :key="String(p.id)"
                    class="col-12 col-sm-6 col-md-4"
                >
                    <q-card>
                        <q-img
                            :src="primaryImageFor(String(p.id))"
                            :style="placeholderStyle(p)"
                            :ratio="16 / 9"
                        >
                            <div class="absolute-bottom">
                                <div class="text-h6">{{ p.name }}</div>
                                <div
                                    class="text-subtitle2"
                                    v-if="programDescription(p)"
                                >
                                    {{ programDescription(p) }}
                                </div>
                            </div>
                        </q-img>

                        <q-card-section class="col-grow">
                            <div
                                v-if="addressDisplayLines(p).length"
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
                                            p,
                                        )"
                                        :key="`addr-${String(p.id)}-${i}`"
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
                                    params: { programId: String(p.id) },
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
                                    params: { programId: String(p.id) },
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
                                    params: { programId: String(p.id) },
                                }"
                            />
                        </q-card-actions>
                    </q-card>
                </div>
            </div>
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import {
    getAppPowerSyncBootstrappedRef,
    getMediaCollection,
    getProgramsCollection,
    useAppPowerSyncOutbox,
} from "../powersync/app-powersync.runtime";
import type { ProgramOutput } from "../powersync/programs.collection";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";
import { usePageLayout } from "../composables/usePageLayout";

const PROGRAM_MODEL = "App\\Models\\Program";

const { t } = useI18n();

usePageLayout({ documentTitleKey: "programsList.title" });
const $q = useQuasar();
const programsCollection = getProgramsCollection();
const hasBootstrapped = getAppPowerSyncBootstrappedRef();

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder
            .from({ p: col })
            .orderBy(({ p }) => p.updated_at, "desc")
            .orderBy(({ p }) => p.created_at, "desc")
            .orderBy(({ p }) => p.id, "desc");
    },
    [programsCollection],
);

const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const mediaCollection = getMediaCollection();
const { data: mediaRows } = useLiveQuery(
    (queryBuilder) => {
        const col = mediaCollection.value;
        if (!col) return undefined;
        return queryBuilder
            .from({ m: col })
            .where(({ m }) => eq(m.collection_name, "images"))
            .orderBy(({ m }) => m.order_column, "asc")
            .orderBy(({ m }) => m.created_at, "asc");
    },
    [mediaCollection],
);

const programTab = ref<"active" | "archived">("active");

const totalProgramCount = computed(() => (programs.value ?? []).length);

const filteredPrograms = computed((): ProgramOutput[] => {
    const list = programs.value ?? [];
    if (programTab.value === "active") {
        return list.filter(
            (p) => p != null && !p.is_archived,
        ) as unknown as ProgramOutput[];
    }
    return list.filter(
        (p) => p != null && p.is_archived,
    ) as unknown as ProgramOutput[];
});

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

function primaryImageFor(programId: string) {
    const rows = mediaRows.value ?? [];
    const match = rows.find(
        (m) =>
            m != null &&
            String((m as Record<string, unknown>).model_type) ===
                PROGRAM_MODEL &&
            String((m as Record<string, unknown>).model_id) === programId &&
            String((m as Record<string, unknown>).collection_name) === "images",
    ) as Record<string, unknown> | undefined;
    if (!match) {
        return undefined;
    }
    const name = match.name;
    if (typeof name !== "string" || name.length === 0) {
        return undefined;
    }
    const fileName = typeof match.file_name === "string" ? match.file_name : "";
    if (fileName.length === 0) {
        return undefined;
    }
    return `/media/${String(match.uuid)}`;
}

function placeholderStyle(p: ProgramOutput) {
    const hex =
        typeof p.theme_color === "string" ? p.theme_color.trim() : "#e0e0e0";
    return { background: hex || "#e0e0e0" };
}

function copyPublicUrl(p: ProgramOutput) {
    const path = "/programs/" + encodeURIComponent(String(p.slug ?? "").trim());
    const url = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(url);
    $q.notify({ type: "positive", message: t("programsList.copied") });
}
</script>

<style scoped></style>

<template>
    <q-page class="q-pa-xl app-programs-page">
        <AppPageHeader
            variant="hero"
            :title="t('programsList.title')"
            :description="t('programsList.description')"
        >
            <template #actions>
                <q-btn
                    unelevated
                    color="white"
                    text-color="primary"
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
                    <q-card
                        flat
                        bordered
                        class="app-program-card full-height column"
                    >
                        <div
                            v-if="primaryImageFor(String(p.id))"
                            class="app-program-card__media"
                        >
                            <q-img
                                :src="primaryImageFor(String(p.id))"
                                ratio="4/3"
                                fit="cover"
                            />
                        </div>
                        <div
                            v-else
                            class="app-program-card__media app-program-card__media--placeholder"
                            :style="placeholderStyle(p)"
                        />
                        <q-card-section class="col-grow">
                            <div class="text-h6 text-weight-bold q-mb-xs">
                                {{ p.name }}
                            </div>
                            <p
                                v-if="programDescription(p)"
                                class="text-body2 text-grey-8 q-mb-sm q-mt-none"
                            >
                                {{ programDescription(p) }}
                            </p>
                            <p
                                v-else
                                class="text-caption text-grey-6 q-mb-sm q-mt-none"
                            >
                                {{ t("programsList.noDescription") }}
                            </p>
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
                        <q-card-actions
                            class="q-pa-md q-pt-sm column items-stretch"
                            vertical
                        >
                            <q-toggle
                                :model-value="programRowIsActive(p as Record<string, unknown>)"
                                :label="t('programsList.isActive')"
                                :disable="isPatching"
                                @update:model-value="
                                    (v) => onToggleActive(p, v)
                                "
                            />
                            <q-btn
                                color="primary"
                                unelevated
                                :label="t('programsList.editProgram')"
                                :to="{
                                    name: 'programs.edit',
                                    params: { id: String(p.id) },
                                }"
                            />
                            <q-btn
                                color="primary"
                                outline
                                :label="t('programsList.copyUrl')"
                                @click="() => copyPublicUrl(p)"
                            />
                        </q-card-actions>
                    </q-card>
                </div>
            </div>
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { usePrograms } from "../models/programs/programs.model";
import { useEntityList } from "../models/entity.queries";
import {
    getAppPowerSyncBootstrappedRef,
    getAddressesCollectionRef,
    getMediaCollectionRef,
    useAppPowerSyncOutbox,
} from "../powersync/app-powersync.runtime";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";

const PROGRAM_MODEL = "App\\Models\\Program";

const { t } = useI18n();
const $q = useQuasar();
const { programs, ensureProgramsReady, patchProgramRow } = usePrograms();
const hasBootstrapped = getAppPowerSyncBootstrappedRef();

const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const { data: addressRows } = useEntityList({
    enabledRef: hasBootstrapped,
    alias: "addresses",
    collection: getAddressesCollectionRef(),
    orderBy: [],
});

const { data: mediaRows } = useEntityList({
    enabledRef: hasBootstrapped,
    alias: "media",
    collection: getMediaCollectionRef(),
    orderBy: [
        { key: "order_column", direction: "asc" },
        { key: "created_at", direction: "asc" },
    ],
});

const isPatching = ref(false);
const programTab = ref<"active" | "archived">("active");

/**
 * Replicated `is_active` (PG boolean / int / text) and local writes (`0` / `1`).
 *
 * @param {Record<string, unknown>} p
 * @returns {boolean}
 */
function programRowIsActive(p: Record<string, unknown>) {
    const v = p.is_active;
    if (v === true || v === 1) {
        return true;
    }
    if (v === false || v === 0) {
        return false;
    }
    if (typeof v === "string") {
        const t = v.trim().toLowerCase();
        if (t === "1" || t === "true" || t === "t") {
            return true;
        }
        if (t === "0" || t === "false" || t === "f" || t.length === 0) {
            return false;
        }
    }
    const n = Number(v);
    if (Number.isFinite(n)) {
        return n === 1;
    }
    return false;
}

/**
 * @param {Record<string, unknown>} p
 * @returns {boolean}
 */
function programRowIsArchived(p: Record<string, unknown>) {
    const v = p.is_archived;
    if (v === true || v === 1) {
        return true;
    }
    if (v === false || v === 0) {
        return false;
    }
    if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (s === "1" || s === "true" || s === "t") {
            return true;
        }
        if (s === "0" || s === "false" || s === "f" || s.length === 0) {
            return false;
        }
    }
    const n = Number(v);
    if (Number.isFinite(n)) {
        return n === 1;
    }
    return false;
}

const totalProgramCount = computed(() => (programs.value ?? []).length);

const filteredPrograms = computed(() => {
    const list = programs.value ?? [];
    if (programTab.value === "active") {
        return list.filter(
            (p) =>
                p != null &&
                !programRowIsArchived(p as Record<string, unknown>),
        );
    }
    return list.filter(
        (p) =>
            p != null && programRowIsArchived(p as Record<string, unknown>),
    );
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

onMounted(() => {
    void ensureProgramsReady();
});

function findAddressForProgram(p: Record<string, unknown>) {
    const id = p.address_id;
    if (id == null || String(id).length === 0) {
        return null;
    }
    const rows = addressRows.value ?? [];
    return (
        rows.find(
            (a) =>
                a != null &&
                String((a as Record<string, unknown>).id) === String(id),
        ) ?? null
    );
}

function programDescription(p: Record<string, unknown>): string {
    const d = p.description;
    if (d == null) {
        return "";
    }
    const s = String(d).trim();

    return s;
}

function addressDisplayLines(p: Record<string, unknown>): string[] {
    const a = findAddressForProgram(p) as Record<string, unknown> | null;
    if (!a) {
        return [];
    }
    const lines: string[] = [];
    const l1 = a.line_1 != null ? String(a.line_1).trim() : "";
    const l2 = a.line_2 != null ? String(a.line_2).trim() : "";
    if (l1.length > 0) {
        lines.push(l1);
    }
    if (l2.length > 0) {
        lines.push(l2);
    }
    const city = a.city != null ? String(a.city).trim() : "";
    const pc = a.postal_code != null ? String(a.postal_code).trim() : "";
    const cityLine = [city, pc].filter((x) => x.length > 0).join(", ");
    if (cityLine.length > 0) {
        lines.push(cityLine);
    }
    const country = a.country != null ? String(a.country).trim() : "";
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
    return `/storage/${String(match.id ?? "")}/${fileName}`;
}

function placeholderStyle(p: Record<string, unknown>) {
    const hex =
        typeof p.theme_color === "string" ? p.theme_color.trim() : "#e0e0e0";
    return { background: hex || "#e0e0e0" };
}

function onToggleActive(p: Record<string, unknown>, isActive: boolean) {
    void (async () => {
        isPatching.value = true;
        try {
            await patchProgramRow(String(p.id), (draft) => {
                draft.is_active = isActive ? 1 : 0;
            });
        } finally {
            isPatching.value = false;
        }
    })();
}

function copyPublicUrl(p: Record<string, unknown>) {
    const path = "/programs/" + encodeURIComponent(String(p.slug ?? "").trim());
    const url = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(url);
    $q.notify({ type: "positive", message: t("programsList.copied") });
}
</script>

<style scoped>
.app-programs-page {
    padding-top: 2rem;
}

.app-program-card {
    border-radius: 12px;
    overflow: hidden;
}

.app-program-card__media {
    overflow: hidden;
    border-radius: 12px 12px 0 0;
}

.app-program-card__media--placeholder {
    min-height: 10.5rem;
    opacity: 0.9;
}
</style>

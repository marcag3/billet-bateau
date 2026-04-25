<template>
    <q-page class="q-pa-xl app-programs-page">
        <section class="programs-hero q-mb-lg">
            <h1 class="text-h4 q-mb-sm text-weight-bold">{{ t('programsList.title') }}</h1>
            <p class="text-body1 q-mb-none programs-hero-copy">
                {{ t('programsList.description') }}
            </p>
        </section>

        <q-banner
            v-if="hasOutboxCommitError"
            class="bg-amber-1 text-dark q-mb-md"
            rounded
        >
            {{ outboxCommitError }}
            <template #action>
                <q-btn
                    flat
                    color="primary"
                    :label="t('common.dismiss')"
                    @click="dismissOutboxCommitError"
                />
            </template>
        </q-banner>

        <q-inner-loading :showing="!hasBootstrapped" />

        <q-list v-if="hasBootstrapped" bordered separator class="bg-white rounded-borders programs-list">
            <q-item v-if="myPrograms.length === 0">
                <q-item-section>
                    <q-item-label>{{ t("programsList.empty") }}</q-item-label>
                </q-item-section>
            </q-item>
            <q-item v-for="p in myPrograms" :key="p.id" class="q-pa-md" style="align-items: flex-start">
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        p.name
                    }}</q-item-label>
                    <div class="row q-col-gutter-sm q-mt-sm items-center">
                        <div class="col-12 col-sm-auto">
                            <q-toggle
                                :model-value="Number(p.is_active) === 1"
                                :label="t('programsList.isActive')"
                                :disable="isPatching"
                                @update:model-value="(v) => onToggleActive(p, v)"
                            />
                        </div>
                        <div class="col-12 col-sm-grow">
                            <q-input
                                :model-value="slugDrafts[p.id] ?? (p.slug ?? '')"
                                outlined
                                dense
                                :label="t('programsList.slug')"
                                :hint="t('programsList.slugHint')"
                                :disable="isPatching"
                                @update:model-value="(v) => (slugDrafts[p.id] = v)"
                                @blur="() => onSlugCommit(p)"
                            />
                        </div>
                        <div class="col-12 col-sm-auto self-center">
                            <q-btn
                                color="primary"
                                outline
                                :label="t('programsList.copyUrl')"
                                @click="() => copyPublicUrl(p)"
                            />
                        </div>
                    </div>
                </q-item-section>
            </q-item>
        </q-list>
    </q-page>
</template>

<script setup>
import { onMounted, computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useAuthStore } from "../store/auth.store";
import { usePrograms } from "../models/programs/programs.model";
import {
    getAppPowerSyncBootstrappedRef,
    useAppPowerSyncOutbox,
} from "../powersync/app-powersync.runtime";

const { t } = useI18n();
const $q = useQuasar();
const authStore = useAuthStore();
const { programs, ensureProgramsReady, patchProgramRow } = usePrograms();
const hasBootstrapped = getAppPowerSyncBootstrappedRef();
getAppPowerSyncErrorMessageRef;

const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const isPatching = ref(false);
const slugDrafts = reactive(/** @type {Record<string, string>} */({}));

const myPrograms = computed(() => {
    const uid = authStore.user?.id;
    if (uid === undefined || uid === null) {
        return [];
    }
    const s = String(uid);
    return programs.value.filter(
        (p) => p != null && String(p.user_id) === s
    );
});

onMounted(() => {
    void ensureProgramsReady();
});

/**
 * @param {Record<string, unknown>} p
 * @param {boolean} isActive
 */
function onToggleActive(p, isActive) {
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

/**
 * @param {Record<string, unknown>} p
 */
function onSlugCommit(p) {
    const id = String(p.id);
    const next = (slugDrafts[id] ?? p.slug ?? "").toString().trim().toLowerCase();
    const current = (p.slug == null ? "" : String(p.slug).trim().toLowerCase());
    if (next === current) {
        return;
    }
    if (next.length === 0) {
        $q.notify({ type: "negative", message: t("programsList.slugRequired") });
        slugDrafts[id] = current;
        return;
    }
    void (async () => {
        isPatching.value = true;
        try {
            await patchProgramRow(id, (draft) => {
                draft.slug = next;
            });
        } finally {
            isPatching.value = false;
        }
    })();
}

/**
 * @param {Record<string, unknown>} p
 */
function copyPublicUrl(p) {
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

.programs-hero {
    border-radius: 1.15rem;
    padding: 1.5rem;
    background: linear-gradient(122deg, rgba(0, 22, 77, 0.95) 0%, rgba(8, 44, 116, 0.94) 64%, rgba(234, 29, 44, 0.9) 100%);
    color: #ffffff;
    box-shadow: 0 20px 40px rgba(0, 22, 77, 0.19);
}

.programs-hero-copy {
    color: rgba(255, 255, 255, 0.9);
}

.programs-list {
    border-color: rgba(0, 22, 77, 0.12);
}
</style>

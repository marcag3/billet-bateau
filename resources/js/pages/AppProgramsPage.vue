<template>
    <q-page class="q-pa-xl app-programs-page">
        <AppPageHeader
            variant="hero"
            :title="t('programsList.title')"
            :description="t('programsList.description')"
        />

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
            <AppEntityList>
                <AppEmptyListRow
                    :show="programs.length === 0"
                    :message="t('programsList.empty')"
                />
                <q-item
                    v-for="p in programs"
                    :key="p.id"
                    class="q-pa-md"
                    style="align-items: flex-start"
                >
                    <q-item-section>
                        <q-item-label class="text-h6">
                            {{ p.name }}
                        </q-item-label>
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
                                    :model-value="slugDrafts[String(p.id)] ?? (p.slug ?? '')"
                                    outlined
                                    dense
                                    :label="t('programsList.slug')"
                                    :hint="t('programsList.slugHint')"
                                    :disable="isPatching"
                                    @update:model-value="(v) => (slugDrafts[String(p.id)] = String(v ?? ''))"
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
            </AppEntityList>
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { safeParseProgramSlug } from '../models/programs/programs.validation';
import { usePrograms } from '../models/programs/programs.model';
import {
    getAppPowerSyncBootstrappedRef,
    useAppPowerSyncOutbox,
} from '../powersync/app-powersync.runtime';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppEntityList from '../components/ui/AppEntityList.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';
import AppBootstrapGate from '../components/ui/AppBootstrapGate.vue';

const { t } = useI18n();
const $q = useQuasar();
const { programs, ensureProgramsReady, patchProgramRow } = usePrograms();
const hasBootstrapped = getAppPowerSyncBootstrappedRef();

const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const isPatching = ref(false);
const slugDrafts = reactive<Record<string, string>>({});

onMounted(() => {
    void ensureProgramsReady();
});

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

function onSlugCommit(p: Record<string, unknown>) {
    const id = String(p.id);
    const raw = (slugDrafts[id] ?? p.slug ?? '').toString();
    const current = p.slug == null ? '' : String(p.slug).trim().toLowerCase();
    const parsed = safeParseProgramSlug(t, raw);
    if (!parsed.success) {
        $q.notify({
            type: 'negative',
            message: parsed.error.issues[0]?.message ?? t('programsList.slugRequired'),
        });
        slugDrafts[id] = current;
        return;
    }
    const next = parsed.data;
    if (next === current) {
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

function copyPublicUrl(p: Record<string, unknown>) {
    const path = '/programs/' + encodeURIComponent(String(p.slug ?? '').trim());
    const url = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(url);
    $q.notify({ type: 'positive', message: t('programsList.copied') });
}
</script>

<style scoped>
.app-programs-page {
    padding-top: 2rem;
}
</style>

<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('waterRoutesList.title')"
            :description="t('waterRoutesList.description')"
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

        <AppBootstrapGate
            :ready="hasBootstrapped"
            content-class="q-gutter-y-md"
        >
            <AppCardSection :label="t('waterRoutesList.addNew')">
                <q-form @submit.prevent="onCreateSubmit">
                    <AppFormStack>
                        <q-input
                            v-model="createName"
                            v-bind="createNameProps"
                            outlined
                            dense
                            :label="t('waterRoutesList.name')"
                            :disable="isSubmitting"
                        />
                        <q-input
                            v-model.number="createDuration"
                            v-bind="createDurationProps"
                            outlined
                            dense
                            type="number"
                            :label="t('waterRoutesList.duration')"
                            :hint="t('waterRoutesList.durationHint')"
                            :disable="isSubmitting"
                        />
                        <q-input
                            v-model="createTrace"
                            v-bind="createTraceProps"
                            outlined
                            dense
                            type="textarea"
                            autogrow
                            :label="t('waterRoutesList.traceOptional')"
                            :hint="t('waterRoutesList.traceHint')"
                            :disable="isSubmitting"
                        />
                        <q-btn
                            type="submit"
                            color="primary"
                            :label="t('waterRoutesList.create')"
                            :loading="isSubmitting"
                            :disable="!meta.valid || isSubmitting"
                            class="self-start"
                        />
                    </AppFormStack>
                </q-form>
            </AppCardSection>

            <AppEntityList>
                <AppEmptyListRow
                    :show="waterRoutes.length === 0"
                    :message="t('waterRoutesList.empty')"
                />
                <q-item
                    v-for="wr in waterRoutes"
                    :key="String(wr.id)"
                    class="q-pa-md"
                    style="align-items: flex-start"
                >
                    <q-item-section>
                        <q-item-label class="text-h6 q-mb-sm">{{ wr.name }}</q-item-label>
                        <q-input
                            :model-value="String(wr.name ?? '')"
                            outlined
                            dense
                            class="q-mb-sm"
                            :label="t('waterRoutesList.rename')"
                            :disable="patchingId === String(wr.id)"
                            @update:model-value="(v) => setNameDraft(String(wr.id), v)"
                            @blur="() => commitName(wr)"
                        />
                        <q-input
                            :model-value="String(durationDrafts[String(wr.id)] ?? wr.duration_minutes ?? '')"
                            outlined
                            dense
                            type="number"
                            class="q-mb-sm"
                            :label="t('waterRoutesList.editDuration')"
                            :disable="patchingId === String(wr.id)"
                            @update:model-value="(v) => setDurationDraft(String(wr.id), v)"
                            @blur="() => commitDuration(wr)"
                        />
                        <q-input
                            :model-value="String(traceDrafts[String(wr.id)] ?? wr.trace ?? '')"
                            outlined
                            dense
                            type="textarea"
                            autogrow
                            class="q-mb-sm"
                            :label="t('waterRoutesList.traceOptional')"
                            :disable="patchingId === String(wr.id)"
                            @update:model-value="(v) => setTraceDraft(String(wr.id), v)"
                            @blur="() => commitTrace(wr)"
                        />
                        <q-btn
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('waterRoutesList.delete')"
                            :disable="patchingId === String(wr.id)"
                            @click="() => confirmDelete(wr)"
                        />
                    </q-item-section>
                </q-item>
            </AppEntityList>
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import {
    createWaterRouteCreateFormSchema,
    type WaterRouteCreateFormValues,
} from '../models/water-routes/water-routes.validation';
import { safeParseBoatEntityName } from '../models/boats/boats.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { useWaterRoutes } from '../models/water-routes/water-routes.model';
import {
    getAppPowerSyncBootstrappedRef,
    useAppPowerSyncOutbox,
} from '../powersync/app-powersync.runtime';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import { useNotifyErrorFromCatch } from '../composables/useNotifyErrorFromCatch';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppBootstrapGate from '../components/ui/AppBootstrapGate.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppFormStack from '../components/ui/AppFormStack.vue';
import AppEntityList from '../components/ui/AppEntityList.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';

const { t } = useI18n();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();
const {
    waterRoutes,
    ensureWaterRoutesReady,
    createWaterRouteRow,
    patchWaterRouteRow,
    deleteWaterRouteRow,
} = useWaterRoutes();

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const createSchema = createWaterRouteCreateFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } = useForm<WaterRouteCreateFormValues>({
    validationSchema: createSchema,
    initialValues: {
        name: '',
        durationMinutes: 60,
        traceGeoJson: '',
    } satisfies WaterRouteCreateFormValues,
});

const quasarField = createQuasarFieldBinder(defineField);
const [createName, createNameProps] = quasarField('name');
const [createDuration, createDurationProps] = quasarField('durationMinutes');
const [createTrace, createTraceProps] = quasarField('traceGeoJson');

const patchingId = ref('');
const nameDrafts = reactive<Record<string, string>>({});
const durationDrafts = reactive<Record<string, string>>({});
const traceDrafts = reactive<Record<string, string>>({});

onMounted(() => {
    void ensureWaterRoutesReady();
});

function isValidLineStringGeoJson(raw: string): boolean {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        return false;
    }
    try {
        const parsed = JSON.parse(trimmed) as { type?: string };
        return parsed?.type === 'LineString' && Array.isArray((parsed as { coordinates?: unknown }).coordinates);
    } catch {
        return false;
    }
}

function setNameDraft(id: string, v: unknown) {
    nameDrafts[id] = String(v ?? '');
}

function setDurationDraft(id: string, v: unknown) {
    durationDrafts[id] = String(v ?? '');
}

function setTraceDraft(id: string, v: unknown) {
    traceDrafts[id] = String(v ?? '');
}

function commitName(wr: Record<string, unknown>) {
    const id = String(wr.id);
    const next = (nameDrafts[id] ?? String(wr.name ?? '')).trim();
    const current = String(wr.name ?? '').trim();
    if (next === current) {
        return;
    }
    if (next.length === 0) {
        return;
    }
    const parsed = safeParseBoatEntityName(t, next);
    if (!parsed.success) {
        $q.notify({
            type: 'negative',
            message: parsed.error.issues[0]?.message ?? t('boatsList.nameRequired'),
        });
        return;
    }
    void (async () => {
        patchingId.value = id;
        try {
            await patchWaterRouteRow(id, (draft) => {
                draft.name = parsed.data;
            });
        } finally {
            patchingId.value = '';
        }
    })();
}

function commitDuration(wr: Record<string, unknown>) {
    const id = String(wr.id);
    const raw = durationDrafts[id] ?? String(wr.duration_minutes ?? '');
    const n = Number.parseInt(String(raw).trim(), 10);
    const current = Number(wr.duration_minutes);
    if (!Number.isFinite(n) || n < 1) {
        return;
    }
    if (n === current) {
        return;
    }
    void (async () => {
        patchingId.value = id;
        try {
            await patchWaterRouteRow(id, (draft) => {
                draft.duration_minutes = n;
            });
        } finally {
            patchingId.value = '';
        }
    })();
}

function commitTrace(wr: Record<string, unknown>) {
    const id = String(wr.id);
    const next = (traceDrafts[id] ?? String(wr.trace ?? '')).trim();
    const current = String(wr.trace ?? '').trim();
    if (next === current) {
        return;
    }
    if (!isValidLineStringGeoJson(next)) {
        $q.notify({ type: 'negative', message: t('waterRoutesList.invalidGeoJson') });
        return;
    }
    void (async () => {
        patchingId.value = id;
        try {
            await patchWaterRouteRow(id, (draft) => {
                draft.trace = next;
            });
        } finally {
            patchingId.value = '';
        }
    })();
}

const onCreateSubmit = handleSubmit(async (values: WaterRouteCreateFormValues) => {
    await runWithNotify(
        async () => {
            const trace = String(values.traceGeoJson ?? '').trim();
            await createWaterRouteRow({
                name: values.name,
                durationMinutes: values.durationMinutes,
                traceGeoJson: trace.length > 0 ? trace : undefined,
            });
            resetForm();
        },
        { successMessage: t('waterRoutesList.created'), errorGeneric: t('waterRoutesList.errorGeneric') },
    );
});

function confirmDelete(wr: Record<string, unknown>) {
    confirm({
        title: t('waterRoutesList.deleteConfirmTitle'),
        message: t('waterRoutesList.deleteConfirmMessage', { name: String(wr.name ?? '') }),
        onOk: async () => {
            try {
                await deleteWaterRouteRow(String(wr.id));
                $q.notify({ type: 'positive', message: t('waterRoutesList.deleted') });
            } catch (e) {
                notifyError(e, t('waterRoutesList.errorGeneric'));
            }
        },
    });
}
</script>

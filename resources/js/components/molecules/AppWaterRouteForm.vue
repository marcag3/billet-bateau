<template>
    <q-form class="column gap-4" @submit="onSubmit">
        <div class="column gap-4">
            <q-input
                v-model="name"
                v-bind="nameProps"
                outlined
                dense
                autofocus
                :label="t('waterRoutesList.name')"
                :disable="isSubmitting"
            />
            <q-input
                v-model.number="durationMinutes"
                v-bind="durationMinutesProps"
                outlined
                dense
                type="number"
                :label="t('waterRoutesList.duration')"
                :hint="t('waterRoutesList.durationHint')"
                :disable="isSubmitting"
            />
            <AppPolylineTraceField
                v-model="traceGeoJson"
                v-bind="traceGeoJsonProps"
                :label="t('waterRoutesList.traceOptional')"
                :hint="t('waterRoutesList.traceHint')"
                :disable="isSubmitting"
            />
        </div>

        <div class="row justify-end gap-2">
            <q-btn
                flat
                :label="t('common.dismiss')"
                :disable="isSubmitting"
                type="button"
                @click="onCancel"
            />
            <q-btn
                color="primary"
                type="submit"
                :label="isEditMode ? t('waterRoutesList.save') : t('waterRoutesList.create')"
                :loading="isSubmitting"
                :disable="!meta.valid || isSubmitting"
            />
        </div>
    </q-form>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { ulid } from 'ulid';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import {
    createEmptyWaterRouteFormValues,
    createWaterRouteFormSchema,
    type WaterRouteFormValues,
} from '../../models/water-routes/water-routes.validation';
import { createQuasarFieldBinder } from '../../validation/quasar-vee-fields';
import { getAppPowerSyncContext } from '../../powersync/app-powersync.runtime';
import type { WaterRouteOutput } from '../../powersync/water-routes.collection';
import { liveQueryRow } from '../../powersync/live-query-casts';
import { useNotifyErrorFromCatch } from '../../composables/useNotifyErrorFromCatch';
import { isPersistableLineStringGeoJson } from '../../utilities/geojson-line-string';
import AppPolylineTraceField from './AppPolylineTraceField.vue';

const props = defineProps<{
    programId: string;
    waterRouteId: string | null;
}>();

const emit = defineEmits<{
    (e: 'cancel'): void;
    (e: 'success', payload: { id: string; mode: 'create' | 'edit' }): void;
}>();

const { t } = useI18n();
const $q = useQuasar();
const { notifyError } = useNotifyErrorFromCatch();

const powersync = getAppPowerSyncContext();
const waterRoutesCollection = powersync.collections.water_routes;

/** Default LineString (Montreal area) as GeoJSON; matches server tests / upload applier. */
const DEFAULT_WATER_ROUTE_TRACE_GEOJSON =
    '{"type":"LineString","coordinates":[[-73.5673,45.5017],[-73.5540,45.5080]]}';

const waterRouteFormSchema = createWaterRouteFormSchema(t);
const {
    handleSubmit,
    defineField,
    meta,
    isSubmitting,
    resetForm,
} = useForm<WaterRouteFormValues>({
    validationSchema: waterRouteFormSchema,
    initialValues: createEmptyWaterRouteFormValues(),
    validateOnMount: true,
});

const quasarField = createQuasarFieldBinder(defineField);
const [name, nameProps] = quasarField('name');
const [durationMinutes, durationMinutesProps] = quasarField('durationMinutes');
const [traceGeoJson, traceGeoJsonProps] = quasarField('traceGeoJson');

const waterRouteIdRef = computed(() =>
    props.waterRouteId != null && String(props.waterRouteId).length > 0
        ? String(props.waterRouteId)
        : '',
);

const { data: waterRouteRows } = useLiveQuery(
    (queryBuilder) => {
        const col = waterRoutesCollection.value;
        const id = waterRouteIdRef.value;
        if (!col || id.length === 0) {
            return undefined;
        }
        return queryBuilder.from({ wr: col }).where(({ wr }) => eq(wr.id, id));
    },
    [waterRoutesCollection, waterRouteIdRef],
);

const isEditMode = computed(
    () => props.waterRouteId != null && String(props.waterRouteId).length > 0,
);

function resolveTraceForPersist(traceRaw: string | undefined): string | null {
    const trimmed = traceRaw != null ? String(traceRaw).trim() : '';
    if (trimmed.length === 0) {
        return DEFAULT_WATER_ROUTE_TRACE_GEOJSON;
    }
    if (!isPersistableLineStringGeoJson(trimmed)) {
        return null;
    }
    return trimmed;
}

watch(
    () => [waterRouteIdRef.value, waterRouteRows.value] as const,
    ([id, rows]) => {
        if (id.length === 0) {
            resetForm({ values: createEmptyWaterRouteFormValues() });
            return;
        }
        const row = liveQueryRow<WaterRouteOutput>(rows?.[0]);
        if (!row) {
            return;
        }
        resetForm({
            values: {
                name: String(row.name ?? ''),
                durationMinutes: row.duration_minutes ?? 60,
                traceGeoJson: String(row.trace ?? ''),
            },
        });
    },
    { immediate: true },
);

function onCancel(): void {
    if (!isEditMode.value) {
        resetForm({ values: createEmptyWaterRouteFormValues() });
    }
    emit('cancel');
}

const onSubmit = handleSubmit(async (values: WaterRouteFormValues) => {
    try {
        const programId = props.programId.trim();
        if (programId.length === 0) {
            throw new Error('Select a program before saving water routes.');
        }
        const col = waterRoutesCollection.value;
        if (!col) {
            throw new Error('Water routes collection is not ready.');
        }
        const displayName = String(values.name ?? '').trim();
        const duration = Number.parseInt(String(values.durationMinutes), 10);
        if (!Number.isFinite(duration) || duration < 1) {
            throw new Error('Duration must be a positive integer (minutes).');
        }
        const traceResolved = resolveTraceForPersist(values.traceGeoJson);
        if (traceResolved === null) {
            $q.notify({
                type: 'negative',
                message: t('waterRoutesList.invalidGeoJson'),
            });
            return;
        }

        if (isEditMode.value) {
            const id = String(props.waterRouteId);
            col.update(id, (draft) => {
                draft.name = displayName.length > 0 ? displayName : 'Untitled';
                draft.duration_minutes = duration;
                draft.trace = traceResolved;
            });
            void powersync.refreshOutboxSnapshot();
            emit('success', { id, mode: 'edit' });
            return;
        }

        const id = ulid();
        await col.insert({
            id,
            program_id: programId,
            name: displayName.length > 0 ? displayName : 'Untitled',
            trace: traceResolved,
            duration_minutes: duration,
        }).isPersisted.promise;
        void powersync.refreshOutboxSnapshot();
        resetForm({ values: createEmptyWaterRouteFormValues() });
        emit('success', { id, mode: 'create' });
    } catch (e) {
        notifyError(e, t('waterRoutesList.errorGeneric'));
    }
});
</script>

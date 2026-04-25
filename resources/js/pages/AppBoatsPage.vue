<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('boatsList.title')"
            :description="t('boatsList.description')"
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
            <AppCardSection :label="t('boatsList.programRoster')">
                <q-select
                    v-model="selectedProgramId"
                    outlined
                    emit-value
                    map-options
                    :options="programOptions"
                    :label="t('boatsList.programRoster')"
                    :hint="t('boatsList.programRosterHint')"
                    :disable="programs.length === 0"
                />
                <q-banner
                    v-if="programs.length === 0"
                    class="bg-grey-2 q-mt-sm rounded-borders"
                    dense
                >
                    {{ t('boatsList.noProgramsForBoats') }}
                </q-banner>
            </AppCardSection>

            <AppCardSection :label="t('boatsList.addNew')">
                <q-form @submit.prevent="onCreateSubmit">
                    <AppFormStack>
                        <q-input
                            v-model="createName"
                            v-bind="createNameProps"
                            outlined
                            :label="t('boatsList.name')"
                            :disable="isSubmitting"
                        />
                        <q-input
                            v-model.number="createCapacity"
                            v-bind="createCapacityProps"
                            outlined
                            type="number"
                            :label="t('boatsList.capacity')"
                            :hint="t('boatsList.capacityHint')"
                            clearable
                            :disable="isSubmitting"
                        />
                        <q-input
                            v-model="createNotes"
                            v-bind="createNotesProps"
                            type="textarea"
                            autogrow
                            outlined
                            :label="t('boatsList.notes')"
                            :disable="isSubmitting"
                        />
                        <q-select
                            v-model="createBoatTypeId"
                            v-bind="createBoatTypeIdProps"
                            outlined
                            emit-value
                            map-options
                            clearable
                            :options="boatTypeOptions"
                            :label="t('boatsList.boatType')"
                            :disable="isSubmitting"
                        />
                        <q-btn
                            color="primary"
                            type="submit"
                            :label="t('boatsList.create')"
                            :loading="isSubmitting"
                            :disable="!meta.valid || isSubmitting || selectedProgramId.trim() === ''"
                            class="self-start"
                        />
                    </AppFormStack>
                </q-form>
            </AppCardSection>

            <AppEntityList>
                <AppEmptyListRow
                    :show="boats.length === 0"
                    :message="t('boatsList.empty')"
                />
                <q-item
                    v-for="b in boats"
                    :key="b.id"
                    class="q-pa-md"
                    style="align-items: flex-start"
                >
                    <q-item-section>
                        <q-item-label class="text-h6 q-mb-sm">{{ b.name }}</q-item-label>
                        <div class="row q-col-gutter-sm q-mb-sm">
                            <div class="col-12 col-sm-6">
                                <q-input
                                    :model-value="String(b.name ?? '')"
                                    outlined
                                    dense
                                    :label="t('boatsList.name')"
                                    :disable="patchingId === b.id"
                                    @update:model-value="(v) => setFieldDraft(b.id, 'name', v)"
                                    @blur="() => commitField(b, 'name')"
                                />
                            </div>
                            <div class="col-12 col-sm-3">
                                <q-input
                                    :model-value="draftNumber(b, 'capacity')"
                                    outlined
                                    dense
                                    type="number"
                                    :label="t('boatsList.capacity')"
                                    clearable
                                    :disable="patchingId === b.id"
                                    @update:model-value="(v) => setFieldDraft(b.id, 'capacity', v)"
                                    @blur="() => commitCapacity(b)"
                                />
                            </div>
                            <div class="col-12 col-sm-3">
                                <q-select
                                    :model-value="boatTypeSelectValue(b)"
                                    outlined
                                    dense
                                    emit-value
                                    map-options
                                    clearable
                                    :options="boatTypeOptions"
                                    :label="t('boatsList.boatType')"
                                    :disable="patchingId === b.id"
                                    @update:model-value="(v) => onBoatTypeChange(b, v)"
                                />
                            </div>
                        </div>
                        <q-input
                            :model-value="String(b.notes ?? '')"
                            type="textarea"
                            autogrow
                            outlined
                            dense
                            class="q-mb-sm"
                            :label="t('boatsList.notes')"
                            :disable="patchingId === b.id"
                            @update:model-value="(v) => setFieldDraft(b.id, 'notes', v)"
                            @blur="() => commitField(b, 'notes')"
                        />
                        <q-btn
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('boatsList.delete')"
                            :disable="patchingId === b.id"
                            @click="() => confirmDelete(b)"
                        />
                    </q-item-section>
                </q-item>
            </AppEntityList>
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { parseOptionalCapacity, useBoats } from '../models/boats/boats.model';
import { createBoatCreateFormSchema, type BoatCreateFormValues, safeParseBoatEntityName } from '../models/boats/boats.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { useBoatTypes } from '../models/boat-types/boat-types.model';
import {
    getAppPowerSyncBootstrappedRef,
    setProgramSyncScopeId,
    useAppPowerSyncOutbox,
} from '../powersync/app-powersync.runtime';
import { usePrograms } from '../models/programs/programs.model';
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
const { boats, ensureBoatsReady, createBoatRow, patchBoatRow, deleteBoatRow } = useBoats();
const { programs, ensureProgramsReady } = usePrograms();
const { boatTypes, ensureBoatTypesReady } = useBoatTypes();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const boatCreateSchema = createBoatCreateFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } = useForm<BoatCreateFormValues>({
    validationSchema: boatCreateSchema,
    initialValues: {
        name: '',
        capacity: null,
        notes: '',
        boatTypeId: null,
    } satisfies BoatCreateFormValues,
});

const quasarField = createQuasarFieldBinder(defineField);

const [createName, createNameProps] = quasarField('name');
const [createCapacity, createCapacityProps] = quasarField('capacity');
const [createNotes, createNotesProps] = quasarField('notes');
const [createBoatTypeId, createBoatTypeIdProps] = quasarField('boatTypeId');

const patchingId = ref('');
const drafts = reactive<Record<string, Record<string, string>>>({});

const selectedProgramId = ref('');

const programOptions = computed(() =>
    programs.value.map((p) => ({
        label: String(p.name ?? ''),
        value: String(p.id),
    })),
);

watch(
    programs,
    (list) => {
        if (list.length === 0) {
            selectedProgramId.value = '';
            void setProgramSyncScopeId('');
            return;
        }
        const current = selectedProgramId.value.trim();
        if (list.some((p) => String(p.id) === current)) {
            void setProgramSyncScopeId(current);
            return;
        }
        selectedProgramId.value = String(list[0].id);
        void setProgramSyncScopeId(selectedProgramId.value);
    },
    { immediate: true },
);

watch(selectedProgramId, (v) => {
    void setProgramSyncScopeId(v);
});

const boatTypeOptions = computed(() =>
    boatTypes.value.map((bt) => ({
        label: String(bt.name ?? ''),
        value: String(bt.id),
    })),
);

onMounted(() => {
    void ensureProgramsReady();
    void ensureBoatTypesReady();
    void ensureBoatsReady();
});

function boatTypeSelectValue(b: Record<string, unknown>) {
    const v = b.boat_type_id;
    if (v == null || String(v).length === 0) {
        return null;
    }
    return String(v);
}

function draftNumber(b: Record<string, unknown>, field: 'capacity') {
    const id = String(b.id);
    if (drafts[id]?.[field] !== undefined) {
        return drafts[id][field];
    }
    const raw = b[field];
    if (raw === null || raw === undefined || raw === '') {
        return null;
    }
    return Number(raw);
}

function setFieldDraft(boatId: string, field: string, v: unknown) {
    if (!drafts[boatId]) {
        drafts[boatId] = {};
    }
    drafts[boatId][field] = String(v ?? '');
}

function commitField(b: Record<string, unknown>, field: 'name' | 'notes') {
    const id = String(b.id);
    const draft = drafts[id]?.[field];
    const next = draft !== undefined ? String(draft).trim() : String(b[field] ?? '').trim();
    const current = String(b[field] ?? '').trim();
    if (next === current) {
        return;
    }
    if (field === 'name') {
        const parsed = safeParseBoatEntityName(t, next);
        if (!parsed.success) {
            $q.notify({
                type: 'negative',
                message: parsed.error.issues[0]?.message ?? t('boatsList.nameRequired'),
            });
            return;
        }
    }
    void patchWith(id, (draft) => {
        if (field === 'name') {
            draft.name = next;
        } else {
            draft.notes = next.length > 0 ? next : null;
        }
    });
}

function commitCapacity(b: Record<string, unknown>) {
    const id = String(b.id);
    const raw = drafts[id]?.capacity;
    const current = b.capacity === null || b.capacity === undefined ? null : Number(b.capacity);
    const next = parseOptionalCapacity(raw);
    if (next === current) {
        return;
    }
    void patchWith(id, (draft) => {
        draft.capacity = next;
    });
}

function onBoatTypeChange(b: Record<string, unknown>, value: string | number | null) {
    const id = String(b.id);
    const next = value == null || value === '' ? null : String(value);
    const current =
        b.boat_type_id == null || String(b.boat_type_id).length === 0 ? null : String(b.boat_type_id);
    if (next === current) {
        return;
    }
    void patchWith(id, (draft) => {
        draft.boat_type_id = next;
    });
}

async function patchWith(id: string, fn: (draft: Record<string, unknown>) => void) {
    patchingId.value = id;
    try {
        await patchBoatRow(id, fn);
    } finally {
        patchingId.value = '';
    }
}

const onCreateSubmit = handleSubmit(async (values: BoatCreateFormValues) => {
    await runWithNotify(
        async () => {
            await createBoatRow({
                name: values.name,
                capacity: values.capacity,
                notes: values.notes,
                boatTypeId: values.boatTypeId,
            });
            resetForm();
        },
        { successMessage: t('boatsList.created'), errorGeneric: t('boatsList.errorGeneric') },
    );
});

function confirmDelete(b: Record<string, unknown>) {
    confirm({
        title: t('boatsList.deleteConfirmTitle'),
        message: t('boatsList.deleteConfirmMessage', { name: String(b.name ?? '') }),
        onOk: async () => {
            try {
                await deleteBoatRow(String(b.id));
                $q.notify({ type: 'positive', message: t('boatsList.deleted') });
            } catch (e) {
                notifyError(e, t('boatsList.errorGeneric'));
            }
        },
    });
}
</script>

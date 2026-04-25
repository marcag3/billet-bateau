<template>
    <q-page class="q-pa-xl">
        <h1 class="text-h4 q-mb-sm">{{ t('boatsList.title') }}</h1>
        <p class="text-body1 text-grey-8 q-mb-lg">
            {{ t('boatsList.description') }}
        </p>

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

        <div v-if="hasBootstrapped" class="q-gutter-y-md">
            <q-card flat bordered class="bg-white rounded-borders q-pa-md">
                <div class="text-subtitle2 q-mb-md">{{ t('boatsList.addNew') }}</div>
                <q-form class="q-gutter-md" @submit.prevent="onCreateSubmit">
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
                        :disable="!meta.valid || isSubmitting"
                    />
                </q-form>
            </q-card>

            <q-list bordered separator class="bg-white rounded-borders">
                <q-item v-if="myBoats.length === 0">
                    <q-item-section>
                        <q-item-label>{{ t('boatsList.empty') }}</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item
                    v-for="b in myBoats"
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
            </q-list>
        </div>
    </q-page>
</template>

<script setup>
import { useForm } from 'vee-validate';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../store/auth.store';
import { parseOptionalCapacity, useBoats } from '../models/boats/boats.model';
import { createBoatCreateFormSchema } from '../models/boats/boats.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { safeParseBoatEntityName } from '../models/boats/boats.validation';
import { useBoatTypes } from '../models/boat-types/boat-types.model';
import {
    getAppPowerSyncBootstrappedRef,
    useAppPowerSyncOutbox,
} from '../powersync/app-powersync.runtime';

const { t } = useI18n();
const $q = useQuasar();
const authStore = useAuthStore();
const { boats, ensureBoatsReady, createBoatRow, patchBoatRow, deleteBoatRow } = useBoats();
const { boatTypes, ensureBoatTypesReady } = useBoatTypes();

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const { handleSubmit, defineField, meta, isSubmitting, resetForm } = useForm({
    validationSchema: createBoatCreateFormSchema(t),
    initialValues: {
        name: '',
        capacity: null,
        notes: '',
        boatTypeId: null,
    },
});

const quasarField = createQuasarFieldBinder(defineField);

const [createName, createNameProps] = quasarField('name');
const [createCapacity, createCapacityProps] = quasarField('capacity');
const [createNotes, createNotesProps] = quasarField('notes');
const [createBoatTypeId, createBoatTypeIdProps] = quasarField('boatTypeId');

const patchingId = ref('');
/** @type {import('vue').Reactive<Record<string, Record<string, string>>>} */
const drafts = reactive({});

const myBoats = computed(() => {
    const uid = authStore.user?.id;
    if (uid === undefined || uid === null) {
        return [];
    }
    const s = String(uid);
    return boats.value.filter((row) => row != null && String(row.user_id) === s);
});

const myBoatTypes = computed(() => {
    const uid = authStore.user?.id;
    if (uid === undefined || uid === null) {
        return [];
    }
    const s = String(uid);
    return boatTypes.value.filter((row) => row != null && String(row.user_id) === s);
});

const boatTypeOptions = computed(() =>
    myBoatTypes.value.map((bt) => ({
        label: String(bt.name ?? ''),
        value: String(bt.id),
    })),
);

onMounted(() => {
    void ensureBoatTypesReady();
    void ensureBoatsReady();
});

/**
 * @param {Record<string, unknown>} b
 */
function boatTypeSelectValue(b) {
    const v = b.boat_type_id;
    if (v == null || String(v).length === 0) {
        return null;
    }
    return String(v);
}

/**
 * @param {Record<string, unknown>} b
 * @param {string} field
 */
function draftNumber(b, field) {
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

/**
 * @param {string} boatId
 * @param {string} field
 * @param {unknown} v
 */
function setFieldDraft(boatId, field, v) {
    if (!drafts[boatId]) {
        drafts[boatId] = {};
    }
    drafts[boatId][field] = String(v ?? '');
}

/**
 * @param {Record<string, unknown>} b
 * @param {'name' | 'notes'} field
 */
function commitField(b, field) {
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

/**
 * @param {Record<string, unknown>} b
 */
function commitCapacity(b) {
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

/**
 * @param {Record<string, unknown>} b
 * @param {string | number | null} value
 */
function onBoatTypeChange(b, value) {
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

/**
 * @param {string} id
 * @param {(draft: Record<string, unknown>) => void} fn
 */
async function patchWith(id, fn) {
    patchingId.value = id;
    try {
        await patchBoatRow(id, fn);
    } finally {
        patchingId.value = '';
    }
}

const onCreateSubmit = handleSubmit(async (values) => {
    try {
        await createBoatRow({
            name: values.name,
            capacity: values.capacity,
            notes: values.notes,
            boatTypeId: values.boatTypeId,
        });
        resetForm();
        $q.notify({ type: 'positive', message: t('boatsList.created') });
    } catch (e) {
        $q.notify({
            type: 'negative',
            message: e instanceof Error ? e.message : t('boatsList.errorGeneric'),
        });
    }
});

/**
 * @param {Record<string, unknown>} b
 */
function confirmDelete(b) {
    $q.dialog({
        title: t('boatsList.deleteConfirmTitle'),
        message: t('boatsList.deleteConfirmMessage', { name: String(b.name ?? '') }),
        cancel: true,
        persistent: true,
    }).onOk(() => {
        void (async () => {
            try {
                await deleteBoatRow(String(b.id));
                $q.notify({ type: 'positive', message: t('boatsList.deleted') });
            } catch (e) {
                $q.notify({
                    type: 'negative',
                    message: e instanceof Error ? e.message : t('boatsList.errorGeneric'),
                });
            }
        })();
    });
}
</script>

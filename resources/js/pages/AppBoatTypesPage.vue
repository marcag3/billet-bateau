<template>
    <q-page class="q-pa-xl">
        <h1 class="text-h4 q-mb-sm">{{ t('boatTypesList.title') }}</h1>
        <p class="text-body1 text-grey-8 q-mb-lg">
            {{ t('boatTypesList.description') }}
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
                <div class="text-subtitle2 q-mb-sm">{{ t('boatTypesList.addNew') }}</div>
                <div class="row q-col-gutter-sm items-end">
                    <div class="col-12 col-sm-grow">
                        <q-input
                            v-model="newName"
                            outlined
                            dense
                            :label="t('boatTypesList.name')"
                            :disable="isCreating"
                            @keyup.enter="onCreateBoatType"
                        />
                    </div>
                    <div class="col-12 col-sm-auto">
                        <q-btn
                            color="primary"
                            :label="t('boatTypesList.create')"
                            :loading="isCreating"
                            :disable="newName.trim().length === 0"
                            @click="onCreateBoatType"
                        />
                    </div>
                </div>
            </q-card>

            <q-list bordered separator class="bg-white rounded-borders">
                <q-item v-if="myBoatTypes.length === 0">
                    <q-item-section>
                        <q-item-label>{{ t('boatTypesList.empty') }}</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item
                    v-for="bt in myBoatTypes"
                    :key="bt.id"
                    class="q-pa-md"
                    style="align-items: flex-start"
                >
                    <q-item-section>
                        <q-item-label class="text-h6 q-mb-sm">{{ bt.name }}</q-item-label>
                        <q-input
                            :model-value="String(bt.name ?? '')"
                            outlined
                            dense
                            class="q-mb-sm"
                            :label="t('boatTypesList.rename')"
                            :disable="patchingId === bt.id"
                            @update:model-value="(v) => setNameDraft(bt.id, v)"
                            @blur="() => commitName(bt)"
                        />
                        <div class="row q-col-gutter-md items-start q-mb-sm">
                            <div class="col-12 col-md-6">
                                <div v-if="primaryImageFor(bt.id)" class="q-mb-xs">
                                    <q-img
                                        :src="primaryImageFor(bt.id)"
                                        ratio="16/9"
                                        class="rounded-borders"
                                        style="max-height: 12rem"
                                        fit="cover"
                                    />
                                </div>
                                <q-file
                                    outlined
                                    dense
                                    multiple
                                    use-chips
                                    counter
                                    :label="t('boatTypesList.images')"
                                    accept="image/jpeg,image/png,image/webp"
                                    :disable="uploadingId === bt.id"
                                    @update:model-value="(files) => onPickImages(bt.id, files)"
                                />
                            </div>
                        </div>
                        <q-btn
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('boatTypesList.delete')"
                            :disable="patchingId === bt.id || uploadingId === bt.id"
                            @click="() => confirmDelete(bt)"
                        />
                    </q-item-section>
                </q-item>
            </q-list>
        </div>
    </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../store/auth.store';
import { useBoatTypes } from '../models/boat-types/boat-types.model';
import { useEntityList } from '../models/entity.queries';
import {
    getAppPowerSyncBootstrappedRef,
    getMediaCollectionRef,
    useAppPowerSyncOutbox,
} from '../powersync/app-powersync.runtime';
import boatTypesRoutes from '../routes/api/boat-types';
import { requestFormData } from '../services/http.client';

const BOAT_TYPE_MODEL = 'App\\Models\\BoatType';

const { t } = useI18n();
const $q = useQuasar();
const authStore = useAuthStore();
const {
    boatTypes,
    ensureBoatTypesReady,
    createBoatTypeRow,
    patchBoatTypeRow,
    deleteBoatTypeRow,
} = useBoatTypes();

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const { data: mediaRows } = useEntityList({
    enabledRef: hasBootstrapped,
    alias: 'media',
    collection: getMediaCollectionRef(),
    orderBy: [
        { key: 'order_column', direction: 'asc' },
        { key: 'created_at', direction: 'asc' },
    ],
});

const newName = ref('');
const isCreating = ref(false);
const patchingId = ref('');
const uploadingId = ref('');
/** @type {import('vue').Reactive<Record<string, string>>} */
const nameDrafts = reactive({});

const myBoatTypes = computed(() => {
    const uid = authStore.user?.id;
    if (uid === undefined || uid === null) {
        return [];
    }
    const s = String(uid);
    return boatTypes.value.filter((row) => row != null && String(row.user_id) === s);
});

onMounted(() => {
    void ensureBoatTypesReady();
});

/**
 * @param {string} id
 * @param {unknown} v
 */
function setNameDraft(id, v) {
    nameDrafts[id] = String(v ?? '');
}

/**
 * @param {string} boatTypeId
 * @returns {string | undefined}
 */
function primaryImageFor(boatTypeId) {
    const rows = mediaRows.value ?? [];
    const match = rows.find(
        (m) =>
            m != null &&
            String(m.model_type) === BOAT_TYPE_MODEL &&
            String(m.model_id) === boatTypeId &&
            String(m.collection_name) === 'images',
    );
    if (!match || typeof match.name !== 'string') {
        return undefined;
    }
    const fileName = typeof match.file_name === 'string' ? match.file_name : '';
    if (fileName.length === 0) {
        return undefined;
    }
    return `/storage/${match.id}/${fileName}`;
}

/**
 * @param {Record<string, unknown>} bt
 */
function commitName(bt) {
    const id = String(bt.id);
    const next = (nameDrafts[id] ?? String(bt.name ?? '')).trim();
    const current = String(bt.name ?? '').trim();
    if (next === current || next.length === 0) {
        return;
    }
    void (async () => {
        patchingId.value = id;
        try {
            await patchBoatTypeRow(id, (draft) => {
                draft.name = next;
            });
        } finally {
            patchingId.value = '';
        }
    })();
}

async function onCreateBoatType() {
    const name = newName.value.trim();
    if (name.length === 0) {
        return;
    }
    isCreating.value = true;
    try {
        await createBoatTypeRow(name);
        newName.value = '';
        $q.notify({ type: 'positive', message: t('boatTypesList.created') });
    } catch (e) {
        $q.notify({
            type: 'negative',
            message: e instanceof Error ? e.message : t('boatTypesList.errorGeneric'),
        });
    } finally {
        isCreating.value = false;
    }
}

/**
 * @param {string} boatTypeId
 * @param {File | File[] | null} value
 */
async function onPickImages(boatTypeId, value) {
    const files = normalizeFiles(value);
    if (files.length === 0) {
        return;
    }
    uploadingId.value = boatTypeId;
    try {
        const formData = new FormData();
        for (const file of files) {
            formData.append('images[]', file);
        }
        await requestFormData(boatTypesRoutes.media.store.url({ boatType: boatTypeId }), formData, {
            withCsrf: true,
        });
        $q.notify({ type: 'positive', message: t('boatTypesList.imagesUploaded') });
    } catch (e) {
        $q.notify({
            type: 'negative',
            message: e instanceof Error ? e.message : t('boatTypesList.errorGeneric'),
        });
    } finally {
        uploadingId.value = '';
    }
}

/**
 * @param {File | File[] | null} value
 * @returns {File[]}
 */
function normalizeFiles(value) {
    if (value == null) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.filter((f) => f instanceof File);
    }
    return value instanceof File ? [value] : [];
}

/**
 * @param {Record<string, unknown>} bt
 */
function confirmDelete(bt) {
    $q.dialog({
        title: t('boatTypesList.deleteConfirmTitle'),
        message: t('boatTypesList.deleteConfirmMessage', { name: String(bt.name ?? '') }),
        cancel: true,
        persistent: true,
    }).onOk(() => {
        void (async () => {
            try {
                await deleteBoatTypeRow(String(bt.id));
                $q.notify({ type: 'positive', message: t('boatTypesList.deleted') });
            } catch (e) {
                $q.notify({
                    type: 'negative',
                    message: e instanceof Error ? e.message : t('boatTypesList.errorGeneric'),
                });
            }
        })();
    });
}
</script>

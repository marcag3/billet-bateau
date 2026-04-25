<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('boatTypesList.title')"
            :description="t('boatTypesList.description')"
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
            <AppCardSection :label="t('boatTypesList.addNew')">
                <q-form
                    class="row q-col-gutter-sm items-end"
                    @submit.prevent="onCreateSubmit"
                >
                    <div class="col-12 col-sm-grow">
                        <q-input
                            v-model="createName"
                            v-bind="createNameProps"
                            outlined
                            dense
                            :label="t('boatTypesList.name')"
                            :disable="isSubmitting"
                        />
                    </div>
                    <div class="col-12 col-sm-auto">
                        <q-btn
                            type="submit"
                            color="primary"
                            :label="t('boatTypesList.create')"
                            :loading="isSubmitting"
                            :disable="!meta.valid || isSubmitting"
                        />
                    </div>
                </q-form>
            </AppCardSection>

            <AppEntityList>
                <AppEmptyListRow
                    :show="myBoatTypes.length === 0"
                    :message="t('boatTypesList.empty')"
                />
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
                                <div
                                    v-if="primaryImageFor(bt.id)"
                                    class="q-mb-xs"
                                >
                                    <q-img
                                        :src="primaryImageFor(bt.id)"
                                        ratio="16/9"
                                        class="rounded-borders"
                                        style="max-height: 12rem"
                                        fit="cover"
                                    />
                                </div>
                                <q-file
                                    :model-value="null"
                                    outlined
                                    dense
                                    multiple
                                    use-chips
                                    counter
                                    :label="t('boatTypesList.images')"
                                    accept="image/jpeg,image/png,image/webp"
                                    :disable="uploadingId === bt.id"
                                    @update:model-value="(files) => onPickImages(String(bt.id), files)"
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
            </AppEntityList>
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../store/auth.store';
import { createBoatTypeFormSchema, type BoatTypeFormValues } from '../models/boat-types/boat-types.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { safeParseBoatEntityName } from '../models/boats/boats.validation';
import { useBoatTypes } from '../models/boat-types/boat-types.model';
import { useEntityList } from '../models/entity.queries';
import {
    getAppPowerSyncBootstrappedRef,
    getMediaCollectionRef,
    useAppPowerSyncOutbox,
} from '../powersync/app-powersync.runtime';
import mediaRoutes from '../routes/api/media';
import { requestFormData } from '../services/http.client';
import { normalizeImageFiles } from '../utilities/image-files';
import { useUserScopedCollection } from '../composables/useUserScopedCollection';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import { useNotifyErrorFromCatch } from '../composables/useNotifyErrorFromCatch';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppBootstrapGate from '../components/ui/AppBootstrapGate.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppEntityList from '../components/ui/AppEntityList.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';

const BOAT_TYPE_MODEL = 'App\\Models\\BoatType';

const { t } = useI18n();
const $q = useQuasar();
const authStore = useAuthStore();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();
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

const boatTypeFormSchema = createBoatTypeFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } = useForm<BoatTypeFormValues>({
    validationSchema: boatTypeFormSchema,
    initialValues: {
        name: '',
    } satisfies BoatTypeFormValues,
});

const quasarField = createQuasarFieldBinder(defineField);
const [createName, createNameProps] = quasarField('name');

const patchingId = ref('');
const uploadingId = ref('');
const nameDrafts = reactive<Record<string, string>>({});

const myBoatTypes = useUserScopedCollection(boatTypes, () => authStore.user?.id);

onMounted(() => {
    void ensureBoatTypesReady();
});

function setNameDraft(id: string, v: unknown) {
    nameDrafts[id] = String(v ?? '');
}

function primaryImageFor(boatTypeId: string) {
    const rows = mediaRows.value ?? [];
    const match = rows.find(
        (m: Record<string, unknown> | null) =>
            m != null &&
            String(m.model_type) === BOAT_TYPE_MODEL &&
            String(m.model_id) === boatTypeId &&
            String(m.collection_name) === 'images',
    );
    if (!match || typeof match['name'] !== 'string') {
        return undefined;
    }
    const fileName = typeof match['file_name'] === 'string' ? match['file_name'] : '';
    if (fileName.length === 0) {
        return undefined;
    }
    return `/storage/${String(match['id'] ?? '')}/${fileName}`;
}

function commitName(bt: Record<string, unknown>) {
    const id = String(bt.id);
    const next = (nameDrafts[id] ?? String(bt.name ?? '')).trim();
    const current = String(bt.name ?? '').trim();
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
            await patchBoatTypeRow(id, (draft) => {
                draft.name = parsed.data;
            });
        } finally {
            patchingId.value = '';
        }
    })();
}

const onCreateSubmit = handleSubmit(async (values: BoatTypeFormValues) => {
    await runWithNotify(
        async () => {
            await createBoatTypeRow(values.name);
            resetForm();
        },
        { successMessage: t('boatTypesList.created'), errorGeneric: t('boatTypesList.errorGeneric') },
    );
});

async function onPickImages(
    boatTypeId: string,
    value: File | File[] | null | undefined,
) {
    const files = normalizeImageFiles(value);
    if (files.length === 0) {
        return;
    }
    uploadingId.value = boatTypeId;
    try {
        const formData = new FormData();
        for (const file of files) {
            formData.append('images[]', file);
        }
        await requestFormData(mediaRoutes.store.url({ type: 'boat_type', id: boatTypeId }), formData, {
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

function confirmDelete(bt: Record<string, unknown>) {
    confirm({
        title: t('boatTypesList.deleteConfirmTitle'),
        message: t('boatTypesList.deleteConfirmMessage', { name: String(bt.name ?? '') }),
        onOk: async () => {
            try {
                await deleteBoatTypeRow(String(bt.id));
                $q.notify({ type: 'positive', message: t('boatTypesList.deleted') });
            } catch (e) {
                notifyError(e, t('boatTypesList.errorGeneric'));
            }
        },
    });
}
</script>

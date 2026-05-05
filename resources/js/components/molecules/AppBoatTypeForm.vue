<template>
    <q-form class="q-gutter-md" @submit="onSubmit">
        <q-input
            v-model="name"
            outlined
            dense
            autofocus
            :label="t('boatTypesList.name')"
            v-bind="nameProps"
            :disable="isSubmitting"
        />

        <div v-if="isEditMode && existingImages.length > 0" class="text-caption text-grey-7">
            {{ t('boatTypesList.existingImages') }}
        </div>
        <div v-if="isEditMode && existingImages.length > 0" class="row q-col-gutter-sm">
            <div
                v-for="item in existingImages"
                :key="item.uuid"
                class="col-auto"
            >
                <q-card flat bordered class="relative-position boat-type-media-thumb">
                    <q-img
                        :src="item.url"
                        :ratio="1"
                        fit="cover"
                        class="boat-type-media-thumb-img"
                    />
                    <q-btn
                        flat
                        round
                        dense
                        icon="close"
                        color="negative"
                        size="sm"
                        class="absolute-top-right q-ma-xs"
                        :loading="deletingMediaUuid === item.uuid"
                        :disable="isSubmitting || deletingMediaUuid !== null"
                        :aria-label="t('boatTypesList.removeImage')"
                        @click="onRemoveExistingImage(item.uuid)"
                    />
                </q-card>
            </div>
        </div>

        <q-file
            v-model="newImagesModel"
            outlined
            dense
            clearable
            :label="t('boatTypesList.images')"
            :hint="isEditMode ? t('boatTypesList.imagesEditHint') : t('boatTypesList.imagesCreateHint')"
            accept="image/jpeg,image/png,image/webp"
            :disable="isSubmitting"
        />

        <div class="row justify-end q-gutter-sm">
            <q-btn
                flat
                :label="t('common.dismiss')"
                :disable="isSubmitting"
                type="button"
                @click="emit('cancel')"
            />
            <q-btn
                color="primary"
                type="submit"
                :label="isEditMode ? t('boatTypesList.save') : t('boatTypesList.create')"
                :loading="isSubmitting"
                :disable="!meta.valid || isSubmitting"
            />
        </div>
    </q-form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ulid } from 'ulid';
import {
    getBoatTypesCollection,
    refreshOutboxSnapshot,
} from '../../powersync/app-powersync.runtime';
import {
    createBoatTypeFormSchema,
    createEmptyBoatTypeFormValues,
    type BoatTypeFormValues,
} from '../../models/boat-types/boat-types.validation';
import { useNotifyErrorFromCatch } from '../../composables/useNotifyErrorFromCatch';
import { requestFormData, requestJson } from '../../services/http.client';
import { normalizeImageFiles } from '../../utilities/image-files';
import { createQuasarFieldBinder } from '../../validation/quasar-vee-fields';
import mediaRoutes from '../../routes/api/media';

const props = defineProps<{
    programId: string;
    boatTypeId: string | null;
    initialName?: string;
}>();

const emit = defineEmits<{
    (e: 'cancel'): void;
    (e: 'success', payload: { id: string; mode: 'create' | 'edit' }): void;
}>();

const { t } = useI18n();
const { notifyError } = useNotifyErrorFromCatch();

const boatTypesCollection = getBoatTypesCollection();

const boatTypeFormSchema = createBoatTypeFormSchema(t);
const {
    handleSubmit,
    defineField,
    meta,
    isSubmitting,
    resetForm,
} = useForm<BoatTypeFormValues>({
    validationSchema: boatTypeFormSchema,
    initialValues: createEmptyBoatTypeFormValues(),
    validateOnMount: true,
});

const quasarField = createQuasarFieldBinder(defineField);
const [name, nameProps] = quasarField('name');

const newImagesModel = ref<File | File[] | null>(null);

type MediaListItem = {
    uuid: string;
    name: string;
    url: string;
    mime_type: string | null;
    size: number;
};

const existingImages = ref<MediaListItem[]>([]);
const deletingMediaUuid = ref<string | null>(null);

const isEditMode = computed(
    () => props.boatTypeId != null && String(props.boatTypeId).length > 0,
);

function isMediaListItem(row: unknown): row is MediaListItem {
    if (row === null || typeof row !== 'object') {
        return false;
    }
    const o = row as Record<string, unknown>;
    return (
        typeof o.uuid === 'string' &&
        typeof o.url === 'string' &&
        typeof o.name === 'string'
    );
}

function parseMediaListPayload(payload: Record<string, unknown>): MediaListItem[] {
    const data = payload.data;
    if (!Array.isArray(data)) {
        return [];
    }
    return data.filter(isMediaListItem);
}

async function loadExistingImages(): Promise<void> {
    const id = props.boatTypeId;
    if (id == null || String(id).length === 0) {
        existingImages.value = [];
        return;
    }
    try {
        const payload = await requestJson(
            mediaRoutes.index.url({ type: 'boat_type', id }),
            { method: 'GET', withCsrf: true },
        );
        existingImages.value = parseMediaListPayload(payload);
    } catch (e) {
        notifyError(e, t('boatTypesList.errorGeneric'));
        existingImages.value = [];
    }
}

watch(
    () => [props.boatTypeId, props.initialName] as const,
    () => {
        resetForm({ values: { name: props.initialName ?? '' } });
        newImagesModel.value = null;
        void loadExistingImages();
    },
    { immediate: true },
);

async function uploadNewImages(boatTypeUlid: string): Promise<void> {
    const files = normalizeImageFiles(newImagesModel.value);
    if (files.length === 0) {
        return;
    }
    const formData = new FormData();
    for (const file of files) {
        formData.append('images[]', file);
    }
    await requestFormData(
        mediaRoutes.store.url({ type: 'boat_type', id: boatTypeUlid }),
        formData,
        { withCsrf: true },
    );
    void refreshOutboxSnapshot();
}

async function onRemoveExistingImage(mediaUuid: string): Promise<void> {
    if (isSubmitting.value) {
        return;
    }
    const id = props.boatTypeId;
    if (id == null || id.length === 0) {
        return;
    }
    deletingMediaUuid.value = mediaUuid;
    try {
        await requestJson(
            mediaRoutes.destroy.url({ type: 'boat_type', id, media: mediaUuid }),
            { method: 'DELETE', withCsrf: true },
        );
        existingImages.value = existingImages.value.filter((m) => m.uuid !== mediaUuid);
        void refreshOutboxSnapshot();
    } catch (e) {
        notifyError(e, t('boatTypesList.errorGeneric'));
    } finally {
        deletingMediaUuid.value = null;
    }
}

const onSubmit = handleSubmit(async (values: BoatTypeFormValues) => {
    try {
        const col = boatTypesCollection.value;
        if (!col) {
            throw new Error('Boat types collection not ready.');
        }
        const trimmed = String(values.name ?? '').trim();
        const displayName = trimmed.length > 0 ? trimmed : 'Untitled';

        if (isEditMode.value) {
            const id = String(props.boatTypeId);
            col.update(id, (draft) => {
                draft.name = displayName;
            });
            void refreshOutboxSnapshot();
            emit('success', { id, mode: 'edit' });
            try {
                await uploadNewImages(id);
            } catch (e) {
                notifyError(e, t('boatTypesList.imagesUploadFailed'));
            }
            return;
        }

        const id = ulid();
        await col
            .insert({
                id,
                program_id: props.programId,
                name: displayName,
            })
            .isPersisted.promise;
        void refreshOutboxSnapshot();
        emit('success', { id, mode: 'create' });
        try {
            await uploadNewImages(id);
        } catch (e) {
            notifyError(e, t('boatTypesList.imagesUploadFailed'));
        }
    } catch (e) {
        notifyError(e, t('boatTypesList.errorGeneric'));
    }
});
</script>

<style scoped>
.boat-type-media-thumb {
    width: 88px;
}
.boat-type-media-thumb-img {
    width: 88px;
    height: 88px;
}
</style>

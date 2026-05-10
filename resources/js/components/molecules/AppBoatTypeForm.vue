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

        <div v-if="isEditMode && bannerPreviewUrl.length > 0" class="text-caption text-grey-7">
            {{ t('boatTypesList.existingImages') }}
        </div>

        <AppImageUploadField
            ref="bannerUploadField"
            :label="t('boatTypesList.images')"
            :hint="isEditMode ? t('boatTypesList.imagesEditHint') : t('boatTypesList.imagesCreateHint')"
            dense
            :disabled="isSubmitting"
            accept="image/jpeg,image/png,image/webp"
            :existing-image-url="bannerPreviewUrl"
            :preview-max-width-px="88"
            :preview-ratio="1"
            :presign-url="presignUpload.url()"
            :allow-clear-existing="isEditMode && bannerPreviewUrl.length > 0"
            :clear-existing-loading="isClearingBanner"
            :clear-existing-aria-label="t('boatTypesList.removeImage')"
            @clear-existing="onRemoveBanner"
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
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import {
    createBoatTypeFormSchema,
    createEmptyBoatTypeFormValues,
    type BoatTypeFormValues,
} from '../../models/boat-types/boat-types.validation';
import { useNotifyErrorFromCatch } from '../../composables/useNotifyErrorFromCatch';
import { createQuasarFieldBinder } from '../../validation/quasar-vee-fields';
import { presignUpload } from '../../actions/App/Http/Controllers/Api/PresignUploadController';
import type { BoatTypeOutput } from '../../powersync/boat-types.collection';
import AppImageUploadField from './AppImageUploadField.vue';
import { mediaObjectPublicUrl } from '../../utilities/media-url';

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

const boatTypesCollection = powersync.collections.boat_types;

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

const bannerUploadField = ref<InstanceType<typeof AppImageUploadField> | null>(null);
const isClearingBanner = ref(false);

const boatTypeIdRef = computed(() =>
    props.boatTypeId != null && String(props.boatTypeId).length > 0
        ? String(props.boatTypeId)
        : '',
);

const { data: boatTypeRows } = useLiveQuery(
    (queryBuilder) => {
        const col = boatTypesCollection.value;
        const id = boatTypeIdRef.value;
        if (!col || id.length === 0) {
            return undefined;
        }
        return queryBuilder.from({ bt: col }).where(({ bt }) => eq(bt.id, id));
    },
    [boatTypesCollection, boatTypeIdRef],
);

const bannerPreviewUrl = computed(() => {
    const rows = boatTypeRows.value ?? [];
    const row = rows[0] as unknown as BoatTypeOutput | undefined;
    return mediaObjectPublicUrl(row?.banner_object_key);
});

const isEditMode = computed(
    () => props.boatTypeId != null && String(props.boatTypeId).length > 0,
);

watch(
    () => [props.boatTypeId, props.initialName] as const,
    () => {
        resetForm({ values: { name: props.initialName ?? '' } });
        bannerUploadField.value?.clearSelection();
    },
    { immediate: true },
);

async function uploadBannerIfNeeded(boatTypeUlid: string): Promise<void> {
    const result = await bannerUploadField.value?.uploadIfNeeded();
    if (result == null) {
        return;
    }
    const col = boatTypesCollection.value;
    if (!col) {
        return;
    }
    col.update(boatTypeUlid, (draft) => {
        draft.banner_object_key = result.objectKey;
        draft.banner_mime_type = result.mimeType;
        draft.banner_size_bytes = result.sizeBytes;
        draft.banner_etag = result.etag;
        draft.banner_uploaded_at = new Date().toISOString();
    });
    void powersync.refreshOutboxSnapshot();
}

async function onRemoveBanner(): Promise<void> {
    if (isSubmitting.value) {
        return;
    }
    const id = props.boatTypeId;
    if (id == null || id.length === 0) {
        return;
    }
    const col = boatTypesCollection.value;
    if (!col) {
        return;
    }
    isClearingBanner.value = true;
    try {
        col.update(id, (draft) => {
            draft.banner_object_key = null;
            draft.banner_mime_type = null;
            draft.banner_size_bytes = null;
            draft.banner_etag = null;
            draft.banner_uploaded_at = null;
        });
        void powersync.refreshOutboxSnapshot();
    } catch (e) {
        notifyError(e, t('boatTypesList.errorGeneric'));
    } finally {
        isClearingBanner.value = false;
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
            void powersync.refreshOutboxSnapshot();
            emit('success', { id, mode: 'edit' });
            try {
                await uploadBannerIfNeeded(id);
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
                banner_object_key: null,
                banner_mime_type: null,
                banner_size_bytes: null,
                banner_etag: null,
                banner_uploaded_at: null,
            })
            .isPersisted.promise;
        void powersync.refreshOutboxSnapshot();
        emit('success', { id, mode: 'create' });
        try {
            await uploadBannerIfNeeded(id);
        } catch (e) {
            notifyError(e, t('boatTypesList.imagesUploadFailed'));
        }
    } catch (e) {
        notifyError(e, t('boatTypesList.errorGeneric'));
    }
});
</script>

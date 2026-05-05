<template>
    <AppMapSelect
        :model-value="modelValue"
        :options="optionItems"
        :label="label"
        :disable="disable"
        v-bind="$attrs"
        @update:model-value="onModelValueUpdate"
    >
        <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
                <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn
                        flat
                        round
                        dense
                        icon="edit"
                        @click.stop="() => onRename(opt)"
                    />
                    <q-btn
                        v-if="opt.unused"
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        @click.stop="() => onDelete(opt)"
                    />
                </q-item-section>
            </q-item>
        </template>

        <template #after>
            <q-btn
                flat
                round
                dense
                icon="add"
                @click="showCreateDialog = true"
            />
        </template>
    </AppMapSelect>

    <AppSimpleNameDialog
        v-model:open="showCreateDialog"
        v-model:name="createName"
        :title="t('boatTypesList.addNew')"
        :input-label="t('boatTypesList.name')"
        :confirm-label="t('boatTypesList.create')"
        :dismiss-label="t('common.dismiss')"
        :loading="isCreating"
        :error-message="createError"
        @confirm="onCreateConfirm"
        @dismiss="onCreateDismiss"
    />

    <AppSimpleNameDialog
        v-model:open="showRenameDialog"
        v-model:name="renameName"
        :title="t('boatTypesList.rename')"
        :input-label="t('boatTypesList.name')"
        :confirm-label="t('boatsList.saveChanges')"
        :dismiss-label="t('common.dismiss')"
        :loading="isRenaming"
        :error-message="renameError"
        @confirm="onRenameConfirm"
        @dismiss="onRenameCancel"
    />
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { eq } from '@tanstack/db';
import { useLiveQuery } from '@tanstack/vue-db';
import { ulid } from 'ulid';
import {
    getBoatTypesCollection,
    getBoatsCollection,
    refreshOutboxSnapshot,
} from '../../powersync/app-powersync.runtime';
import { safeParseBoatEntityName } from '../../models/boats/boats.validation';
import { useNotifyErrorFromCatch } from '../../composables/useNotifyErrorFromCatch';
import { useProgramBoatTypes } from '../../composables/useProgramBoatTypes';
import AppMapSelect from '../molecules/AppMapSelect.vue';
import AppSimpleNameDialog from '../molecules/AppSimpleNameDialog.vue';

const props = defineProps<{
    modelValue: string | null;
    programId: string;
    label: string;
    disable?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | null): void;
}>();

function onModelValueUpdate(
    value: string | number | null | undefined,
): void {
    if (value == null || value === '') {
        emit('update:modelValue', null);
        return;
    }
    emit('update:modelValue', String(value));
}

const { t } = useI18n();
const $q = useQuasar();
const { notifyError } = useNotifyErrorFromCatch();

const boatTypesCollection = getBoatTypesCollection();
const boatsCollection = getBoatsCollection();

const programIdRef = toRef(props, 'programId');
const { data: boatTypes } = useProgramBoatTypes(programIdRef);

const { data: boats } = useLiveQuery(
    (queryBuilder) => {
        const col = boatsCollection.value;
        const pid = programIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ b: col })
            .where(({ b }) => eq(b.program_id, pid));
    },
    [boatsCollection, programIdRef],
);

const usedTypeIds = computed(() => {
    const list = boats.value ?? [];
    const ids = new Set<string>();
    for (const b of list) {
        const btId = b.boat_type_id;
        if (btId != null && String(btId).length > 0) {
            ids.add(String(btId));
        }
    }
    return ids;
});

const optionItems = computed(() =>
    (boatTypes.value ?? []).map((bt) => ({
        label: String(bt.name ?? ''),
        value: String(bt.id),
        unused: !usedTypeIds.value.has(String(bt.id)),
        id: String(bt.id),
        name: String(bt.name ?? ''),
    })),
);

// --- Create ---
const showCreateDialog = ref(false);
const createName = ref('');
const createError = ref('');
const isCreating = ref(false);

function onCreateDismiss(): void {
    createError.value = '';
}

function onCreateConfirm() {
    const parsed = safeParseBoatEntityName(t, createName.value);
    if (!parsed.success) {
        createError.value =
            parsed.error.issues[0]?.message ?? t('boatsList.nameRequired');
        return;
    }
    createError.value = '';
    isCreating.value = true;
    void (async () => {
        try {
            const col = boatTypesCollection.value;
            if (!col) throw new Error('Boat types collection not ready.');
            const id = ulid();
            const trimmed = String(parsed.data ?? '').trim();
            await col
                .insert({
                    id,
                    program_id: props.programId,
                    name: trimmed.length > 0 ? trimmed : 'Untitled',
                })
                .isPersisted.promise;
            void refreshOutboxSnapshot();
            // Auto-select the newly created type
            emit('update:modelValue', id);
            showCreateDialog.value = false;
            createName.value = '';
            createError.value = '';
            $q.notify({ type: 'positive', message: t('boatTypesList.created') });
        } catch (e) {
            notifyError(e, t('boatTypesList.errorGeneric'));
        } finally {
            isCreating.value = false;
        }
    })();
}

// --- Rename ---
const showRenameDialog = ref(false);
const renameTarget = ref<{ id: string; name: string } | null>(null);
const renameName = ref('');
const renameError = ref('');
const isRenaming = ref(false);

function onRename(opt: { id: string; name: string }) {
    renameTarget.value = { id: opt.id, name: opt.name };
    renameName.value = opt.name;
    renameError.value = '';
    showRenameDialog.value = true;
}

function onRenameCancel() {
    renameTarget.value = null;
    renameName.value = '';
    renameError.value = '';
}

function onRenameConfirm() {
    const target = renameTarget.value;
    if (!target) return;
    const parsed = safeParseBoatEntityName(t, renameName.value);
    if (!parsed.success) {
        renameError.value =
            parsed.error.issues[0]?.message ?? t('boatsList.nameRequired');
        return;
    }
    renameError.value = '';
    isRenaming.value = true;
    void (async () => {
        try {
            const col = boatTypesCollection.value;
            if (!col) throw new Error('Boat types collection not ready.');
            col.update(target.id, (draft) => {
                draft.name = String(parsed.data).trim();
                draft.updated_at = new Date().toISOString();
            });
            void refreshOutboxSnapshot();
            showRenameDialog.value = false;
            renameTarget.value = null;
            renameName.value = '';
            renameError.value = '';
            $q.notify({
                type: 'positive',
                message: t('boatTypesList.created'),
            });
        } catch (e) {
            notifyError(e, t('boatTypesList.errorGeneric'));
        } finally {
            isRenaming.value = false;
        }
    })();
}

// --- Delete ---
function onDelete(opt: { id: string; name: string }) {
    $q.dialog({
        title: t('boatTypesList.deleteConfirmTitle'),
        message: t('boatTypesList.deleteConfirmMessage', { name: opt.name }),
        cancel: true,
        persistent: true,
    }).onOk(() => {
        void (async () => {
            try {
                const col = boatTypesCollection.value;
                if (!col) return;
                col.delete(String(opt.id));
                void refreshOutboxSnapshot();
                if (props.modelValue === opt.id) {
                    emit('update:modelValue', null);
                }
                $q.notify({
                    type: 'positive',
                    message: t('boatTypesList.deleted'),
                });
            } catch (e) {
                notifyError(e, t('boatTypesList.errorGeneric'));
            }
        })();
    });
}
</script>

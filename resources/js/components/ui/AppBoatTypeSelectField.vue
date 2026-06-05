<template>
    <AppMapSelect :model-value="modelValue" :options="optionItems" :label="label" :disable="disable" v-bind="$attrs"
        @update:model-value="onModelValueUpdate">
        <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
                <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn flat round dense icon="edit" @click.stop="() => onRename(opt)" />
                    <q-btn v-if="opt.unused" flat round dense icon="delete" color="negative"
                        @click.stop="() => onDelete(opt)" />
                </q-item-section>
            </q-item>
        </template>

        <template #after>
            <q-btn flat round dense icon="add" @click="openBoatTypeFormCreate" />
        </template>
    </AppMapSelect>

    <q-dialog v-model="boatTypeFormDialogOpen" persistent>
        <q-card v-if="boatTypeFormDialogOpen" class="w-full md:w-[560px]">
            <q-card-section>
                <div class="text-h6">{{ boatTypeFormDialogTitle }}</div>
            </q-card-section>
            <q-card-section>
                <AppBoatTypeForm :program-id="programId" :boat-type-id="boatTypeFormBoatTypeId"
                    :initial-name="boatTypeFormInitialName" @cancel="closeBoatTypeFormDialog"
                    @success="onBoatTypeFormSuccess" />
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { eq } from '@tanstack/db';
import { useLiveQuery } from '@tanstack/vue-db';
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import { useNotifyErrorFromCatch } from '../../composables/useNotifyErrorFromCatch';
import { useProgramBoatTypes } from '../../composables/useProgramBoatTypes';
import AppMapSelect from '../molecules/AppMapSelect.vue';
import AppBoatTypeForm from '../molecules/AppBoatTypeForm.vue';

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

const boatTypesCollection = powersync.collections.boat_types;
const boatsCollection = powersync.collections.boats;

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

const boatTypeFormDialogOpen = ref(false);
const boatTypeFormBoatTypeId = ref<string | null>(null);
const boatTypeFormInitialName = ref('');

const boatTypeFormDialogTitle = computed(() =>
    boatTypeFormBoatTypeId.value != null && boatTypeFormBoatTypeId.value.length > 0
        ? t('boatTypesList.editBoatType')
        : t('boatTypesList.addNew'),
);

function openBoatTypeFormCreate(): void {
    boatTypeFormBoatTypeId.value = null;
    boatTypeFormInitialName.value = '';
    boatTypeFormDialogOpen.value = true;
}

function closeBoatTypeFormDialog(): void {
    boatTypeFormDialogOpen.value = false;
}

function onBoatTypeFormSuccess(payload: { id: string; mode: 'create' | 'edit' }): void {
    closeBoatTypeFormDialog();
    $q.notify({
        type: 'positive',
        message:
            payload.mode === 'create'
                ? t('boatTypesList.created')
                : t('boatTypesList.updated'),
    });
    if (payload.mode === 'create') {
        emit('update:modelValue', payload.id);
    }
}

function onRename(opt: { id: string; name: string }) {
    boatTypeFormBoatTypeId.value = opt.id;
    boatTypeFormInitialName.value = opt.name;
    boatTypeFormDialogOpen.value = true;
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
                void powersync.refreshOutboxSnapshot();
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

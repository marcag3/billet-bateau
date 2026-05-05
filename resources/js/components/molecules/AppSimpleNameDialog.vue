<template>
    <q-dialog :model-value="open" persistent @update:model-value="onOpenUpdate">
        <q-card>
            <q-card-section>
                <div class="text-h6">{{ title }}</div>
            </q-card-section>
            <q-card-section>
                <q-input
                    :model-value="name"
                    outlined
                    dense
                    autofocus
                    :label="inputLabel"
                    :error="errorMessage.length > 0"
                    :error-message="errorMessage"
                    @update:model-value="onNameUpdate"
                    @keydown.enter.prevent="$emit('confirm')"
                />
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat :label="dismissLabel" @click="onDismiss" />
                <q-btn
                    color="primary"
                    :label="confirmLabel"
                    :loading="loading"
                    @click="$emit('confirm')"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false });
const name = defineModel<string>('name', { default: '' });

withDefaults(
    defineProps<{
        title: string;
        inputLabel: string;
        confirmLabel: string;
        dismissLabel?: string;
        loading?: boolean;
        errorMessage?: string;
    }>(),
    {
        dismissLabel: '',
        loading: false,
        errorMessage: '',
    },
);

const emit = defineEmits<{
    confirm: [];
    dismiss: [];
}>();

function onOpenUpdate(value: boolean): void {
    open.value = value;
}

function onNameUpdate(value: string | number | null): void {
    name.value = String(value ?? '');
}

function onDismiss(): void {
    emit('dismiss');
    open.value = false;
}
</script>

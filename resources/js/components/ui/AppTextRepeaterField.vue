<template>
    <div class="column q-gutter-sm">
        <div class="text-subtitle2">{{ label }}</div>
        <div v-if="hint.length > 0" class="text-caption text-grey-7">
            {{ hint }}
        </div>
        <div
            v-for="(_, index) in rows"
            :key="`text-repeater-${index}`"
            class="rounded-borders bg-grey-1 q-pa-sm q-gutter-y-sm"
        >
            <div class="row items-center q-col-gutter-sm">
                <div class="col text-body2 text-weight-medium">
                    {{ resolveItemLabel(index) }}
                </div>
                <div class="col-auto">
                    <q-btn
                        flat
                        round
                        icon="delete"
                        color="negative"
                        :disable="disabled || !canRemoveRow()"
                        :aria-label="removeLabel"
                        @click="removeRow(index)"
                    />
                </div>
            </div>
            <div>
                <slot
                    name="fields"
                    :index="index"
                    :value="rows[index]"
                    :set-value="(value) => setRowValue(index, value)"
                    :label="resolveItemLabel(index)"
                    :disabled="disabled"
                    :remove-row="() => removeRow(index)"
                    :can-remove="canRemoveRow()"
                />
            </div>
        </div>
        <div>
            <q-btn
                flat
                color="primary"
                icon="add"
                no-caps
                :disable="disabled"
                :label="addLabel"
                @click="addRow"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch } from "vue";

const props = withDefaults(
    defineProps<{
        label: string;
        hint?: string;
        disabled?: boolean;
        itemLabelTemplate?: string;
        addLabel: string;
        removeLabel: string;
        minItems?: number;
        newItem?: string;
        createItem?: () => string;
    }>(),
    {
        hint: "",
        disabled: false,
        itemLabelTemplate: "Item {index}",
        minItems: 1,
        newItem: "",
    },
);

const rows = defineModel<string[]>({ required: true });

defineSlots<{
    fields?(props: {
        index: number;
        value: string;
        setValue: (value: string) => void;
        label: string;
        disabled: boolean;
        removeRow: () => void;
        canRemove: boolean;
    }): unknown;
}>();

watch(
    rows,
    (value) => {
        const nextRows = Array.isArray(value) ? [...value] : [];

        while (nextRows.length < props.minItems) {
            nextRows.push(createNewRow());
        }

        if (!areRowsEqual(nextRows, rows.value)) {
            rows.value = nextRows;
        }
    },
    { immediate: true },
);

function resolveItemLabel(index: number): string {
    return props.itemLabelTemplate.replace("{index}", String(index + 1));
}

function addRow(): void {
    rows.value = [...rows.value, createNewRow()];
}

function removeRow(index: number): void {
    if (!canRemoveRow()) {
        return;
    }

    rows.value = rows.value.filter((_, rowIndex) => rowIndex !== index);
}

function canRemoveRow(): boolean {
    return rows.value.length > props.minItems;
}

function setRowValue(index: number, value: string): void {
    rows.value = rows.value.map((row, rowIndex) =>
        rowIndex === index ? value : row,
    );
}

function createNewRow(): string {
    if (typeof props.createItem === "function") {
        return props.createItem();
    }

    return props.newItem;
}

function areRowsEqual(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
        return false;
    }

    return left.every((item, index) => item === right[index]);
}
</script>

<template>
    <q-table
        v-model:pagination="pagination"
        flat
        bordered
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :no-data-label="noDataLabel"
        :row-class="rowClass"
        :binary-state-sort="true"
        hide-pagination
    >
        <template #top>
            <div class="row q-col-gutter-sm items-center full-width q-pb-sm">
                <div class="col-grow">
                    <q-input
                        :model-value="searchInput"
                        dense
                        outlined
                        clearable
                        :placeholder="searchPlaceholder"
                        @update:model-value="onSearchInput"
                    >
                        <template #prepend>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                </div>
                <div v-if="$slots.filters" class="col-auto row q-gutter-sm items-center">
                    <slot name="filters" />
                </div>
            </div>
        </template>

        <template
            v-for="slotName in forwardedSlotNames"
            :key="slotName"
            #[slotName]="slotProps"
        >
            <slot :name="slotName" v-bind="slotProps ?? {}" />
        </template>
    </q-table>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue';
import type { QTableProps } from 'quasar';

type TableColumn = NonNullable<QTableProps['columns']>[number];
type TableRow = Record<string, unknown>;

const props = withDefaults(
    defineProps<{
        rows: TableRow[];
        columns: TableColumn[];
        loading?: boolean;
        noDataLabel?: string;
        searchPlaceholder?: string;
        defaultSortColumn?: string;
        rowClass?: (row: TableRow) => string;
    }>(),
    {
        loading: false,
        noDataLabel: '',
        searchPlaceholder: '',
        defaultSortColumn: 'departure',
    },
);

const search = defineModel<string>('search', { default: '' });

const searchInput = ref(search.value);
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

watch(search, (value) => {
    if (value !== searchInput.value) {
        searchInput.value = value;
    }
});

const pagination = ref({
    sortBy: props.defaultSortColumn,
    descending: false,
    page: 1,
    rowsPerPage: 0,
});

const slots = useSlots();

const forwardedSlotNames = computed(() =>
    Object.keys(slots).filter((name) => name !== 'filters'),
);

function onSearchInput(value: string | number | null): void {
    const next = String(value ?? '');
    searchInput.value = next;

    if (searchDebounceTimer != null) {
        clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(() => {
        search.value = next;
    }, 200);
}
</script>

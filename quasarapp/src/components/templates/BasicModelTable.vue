<template>
    <q-card flat>
        <q-card-section class="text-h4">
            {{ t(resourceStore.camelCaseName, 2) }}
        </q-card-section>
        <q-card-section>
            <q-table
                :selected-rows-label="resourceStore.getSelectedString"
                :columns="columns"
                :rows="rows"
                row-key="id"
                selection="multiple"
                v-model:selected="resourceStore.selected"
                :disable="resourceStore.isLoading"
                :loading="resourceStore.isLoading"
                :pagination="{ rowsPerPage: 15 }"
                :visible-columns="visibleColumns"
                table-header-class="bg-grey-3"
                wrap-cells
                flat
            >
                <template #top>
                    <div class="col">
                        <div class="row justify-end">
                            <q-input v-model="searchValue" :label="t('search')" dense>
                                <template #prepend>
                                    <q-icon name="fas fa-search" />
                                </template>
                            </q-input>
                        </div>
                        <div class="row justify-end">
                            <q-btn
                                dense
                                class="q-mx-sm"
                                flat
                                color="primary"
                                :disable="resourceStore.isLoading"
                                @click="openCreate"
                                :label="t('create')"
                                icon="fas fa-plus"
                            />
                            <q-btn
                                dense
                                class="q-mx-sm"
                                flat
                                color="positive"
                                :disable="resourceStore.isLoading"
                                @click="exportTable"
                                icon="fas fa-download"
                            >
                                <q-tooltip>
                                    {{ t("download") }}
                                </q-tooltip>
                            </q-btn>
                            <q-space />
                            <slot></slot>

                            <q-btn
                                dense
                                class="q-mx-sm"
                                flat
                                color="negative"
                                :disable="resourceStore.isLoading || resourceStore.selected.length == 0"
                                :label="t('delete')"
                                icon="fas fa-trash"
                                @click="confirmDeleteShow = true"
                            />
                            <q-btn
                                dense
                                class="q-mx-sm"
                                flat
                                color="primary"
                                :disable="resourceStore.isLoading || resourceStore.selected.length !== 1"
                                :label="t('edit_' + resourceStore.snakeCaseName)"
                                icon="fas fa-edit"
                                @click="openEdit()"
                            />
                        </div>
                    </div>
                </template>
                <template v-slot:header-cell="props">
                    <q-th :props="props" class="cursor-pointer" @click.prevent>
                        {{ props.col.label }}
                        <q-icon v-if="colFilters['filter_' + props.col.name]" right name="fas fa-filter" />
                        <q-icon
                            v-if="colSorts.col === props.col.name && colSorts.order === 'ascending'"
                            right
                            name="fas fa-angle-up"
                        />
                        <q-icon
                            v-if="colSorts.col === props.col.name && colSorts.order === 'descending'"
                            right
                            name="fas fa-angle-down"
                        />
                        <q-menu>
                            <q-btn-toggle
                                :model-value="colSorts.col === props.col.name ? colSorts.order : null"
                                @update:model-value="setSort(props.col.name, $event)"
                                toggle-color="primary"
                                clearable
                                style="flex-wrap: wrap"
                                v-close-popup
                                :options="[
                                    {
                                        label: t('ascending'),
                                        value: 'ascending',
                                        icon: 'fas fa-sort-amount-up',
                                        class: 'full-width',
                                        align: 'left',
                                    },
                                    {
                                        label: t('descending'),
                                        value: 'descending',
                                        icon: 'fas fa-sort-amount-down',
                                        class: 'full-width',
                                        align: 'left',
                                    },
                                ]"
                            />
                            <q-input
                                v-if="props.col.filter === 'text'"
                                :model-value="
                                    colFilters['filter_' + props.col.name]
                                        ? colFilters['filter_' + props.col.name].value
                                        : null
                                "
                                @update:model-value="setFilter(props.col, $event)"
                                :label="t('filter')"
                                dense
                                autofocus
                                clearable
                            />
                            <q-input
                                v-if="props.col.filter === 'number'"
                                :model-value="
                                    colFilters['filter_' + props.col.name]
                                        ? colFilters['filter_' + props.col.name].value
                                        : null
                                "
                                @update:model-value="setFilter(props.col, $event)"
                                :label="t('filter')"
                                dense
                                type="number"
                                min="1"
                                autofocus
                                clearable
                            />
                            <div v-if="props.col.filter === 'boolean'" class="col">
                                {{ t("filter") }}
                                <q-btn-toggle
                                    :model-value="
                                        colFilters['filter_' + props.col.name]
                                            ? colFilters['filter_' + props.col.name].value
                                            : null
                                    "
                                    @update:model-value="setFilter(props.col, $event)"
                                    dense
                                    spread
                                    clearable
                                    v-close-popup
                                    :options="[
                                        {
                                            label: t('yes'),
                                            value: true,
                                        },
                                        {
                                            label: t('no'),
                                            value: false,
                                        },
                                    ]"
                                />
                            </div>
                        </q-menu>
                    </q-th>
                </template>
                <template #body="props">
                    <q-tr
                        :props="props"
                        @click="props.selected = !props.selected"
                        @dblclick="(props.selected = true), openEdit(props.row)"
                    >
                        <q-td>
                            <q-checkbox v-model="props.selected" />
                        </q-td>
                        <q-td v-for="col in props.cols" :key="col.name" :props="props">
                            {{ col.value }}
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </q-card-section>
        <Confirm-delete v-if="confirmDeleteShow" @deleteConfirmed="trash" @hide="confirmDeleteShow = false" />
        <component
            v-if="modelEditShow"
            :is="modelEditComponent"
            :create="create"
            @hide="modelEditShow = false"
            @updated="modelEditShow = false"
        />
    </q-card>
</template>

<script>
    import { computed, defineAsyncComponent, defineComponent, onMounted, ref, watch } from "vue";
    import { useI18n } from "vue-i18n";
    import ConfirmDelete from "src/components/forms_elements/ConfirmDelete";
    import { useRouter } from "vue-router";
    import { useTableSort } from "src/composables/useTableSort";
    import { exportFile } from "quasar";
    import { wrapCsvValue } from "src/utilities/helpers";

    export default defineComponent({
        components: {
            ConfirmDelete,
        },
        props: ["resourceStore", "visibleColumns", "columns", "filters"],
        emits: ["deleted"],
        setup(props, { emit }) {
            const { t } = useI18n();
            const confirmDeleteShow = ref(false);
            const router = useRouter();
            const { computedSortMethod } = useTableSort(ref(props.columns));
            const searchValue = ref();
            const modelEditShow = ref(false);
            const create = ref();
            const colSorts = ref({});
            const colFilters = ref({});
            const modelEditComponent = computed(() => {
                return defineAsyncComponent(() =>
                    import("src/components/models_edit/" + props.resourceStore.pascalCaseName + "Edit.vue")
                );
            });

            onMounted(() => {
                props.resourceStore.selected = [];
                watch(
                    () => props.resourceStore.selected,
                    (selected) => {
                        if (selected.length === 1) {
                            props.resourceStore.current = new props.resourceStore.class(
                                props.resourceStore.selected[0]
                            );
                        }
                    }
                );
                if (props.resourceStore.isLoading) return;
                const primaryKeyName = props.resourceStore.class.PRIMARY_KEY_NAME;
                const query = router.currentRoute.value.query;
                if (primaryKeyName in query) {
                    const modelFound = props.resourceStore.list.find(
                        ({ primaryKey }) => primaryKey == query[primaryKeyName]
                    );
                    if (modelFound) {
                        props.resourceStore.selected = [modelFound];
                        create.value = false;
                        modelEditShow.value = true;
                    }
                }
            });

            const rows = computed(() =>
                computedSortMethod.value(
                    props.resourceStore.filteredList({ ...props.filters, ...colFilters.value }, searchValue.value),
                    colSorts.value.col,
                    colSorts.value.order === "descending"
                )
            );

            return {
                t,
                rows,
                colFilters,
                colSorts,
                confirmDeleteShow,
                searchValue,
                modelEditShow,
                create,
                modelEditComponent,
                openEdit(row = null) {
                    if (row) {
                        props.resourceStore.current = new props.resourceStore.class(row);
                    }
                    create.value = false;
                    modelEditShow.value = true;
                },
                openCreate() {
                    create.value = true;
                    modelEditShow.value = true;
                },
                setSort(colName, order) {
                    if (order === null) colSorts.value = {};
                    else colSorts.value = { colName, order };
                },
                setFilter(col, filterValue) {
                    if (filterValue === null) {
                        delete colFilters.value["filter_" + col.name];
                        return;
                    }
                    if (col.filter === "text") {
                        colFilters.value["filter_" + col.name] = {
                            path: col.field,
                            operator: "search",
                            value: filterValue,
                        };
                    } else if (col.filter === "number") {
                        colFilters.value["filter_" + col.name] = {
                            path: col.field,
                            value: Number(filterValue),
                        };
                    } else if (col.filter === "boolean") {
                        colFilters.value["filter_" + col.name] = {
                            path: col.field,
                            value: Boolean(filterValue),
                        };
                    }
                },
                trash() {
                    props.resourceStore.deleteSelected().then(() => emit("deleted"));
                },
                exportTable() {
                    // naive encoding to csv format
                    const content = [props.columns.map((col) => wrapCsvValue(col.label))]
                        .concat(
                            rows.value.map((row) =>
                                props.columns
                                    .map((col) =>
                                        wrapCsvValue(
                                            typeof col.field === "function"
                                                ? col.field(row)
                                                : row[col.field === void 0 ? col.name : col.field],
                                            col.format
                                        )
                                    )
                                    .join(",")
                            )
                        )
                        .join("\r\n");

                    const status = exportFile(
                        "LRDC_" + t(props.resourceStore.camelCaseName, 2) + "_" + new Date().toISOString() + ".csv",
                        content,
                        "text/csv"
                    );

                    if (status !== true) {
                        $q.notify({
                            message: "Browser denied file download...",
                            color: "negative",
                            icon: "warning",
                        });
                    }
                },
            };
        },
    });
</script>

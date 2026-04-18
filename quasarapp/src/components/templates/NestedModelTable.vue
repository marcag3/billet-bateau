<template>
    <q-card-section class="q-pa-none">
        <div class="text-subtitle1 q-pl-md">{{ t(modelName, 2) }}</div>
        <q-table
            :columns="modifiedColumns"
            :rows="modelValue"
            :dense="$q.screen.lt.lg"
            :grid="$q.screen.lt.sm"
            :pagination="{ rowsPerPage: 0 }"
            wrap-cells
            flat
            hide-bottom
        >
            <template v-slot:top class="row justify-end">
                <!-- add/remove buttons -->
                <q-btn
                    size="sm"
                    class="q-mx-sm"
                    flat
                    color="primary"
                    @click="$emit('add')"
                    :label="t('add_' + modelName)"
                    icon="fas fa-plus"
                />
            </template>
            <template v-slot:header="props">
                <q-tr :props="props" class="bg-grey-3">
                    <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                        class=""
                        :class="{ sortable: col.sortable }"
                    >
                        <q-icon :name="col.icon" left />
                        {{ col.label }}
                    </q-th>
                    <q-th>{{ t("actions") }}</q-th>
                </q-tr>
            </template>
            <template v-slot:body="props">
                <NestedModelRow :props="props" display="row" :dense="$q.screen.lt.lg" @removeRow="removeRow($event)" />
            </template>
            <template v-slot:item="props">
                <NestedModelRow :props="props" display="card" :dense="$q.screen.lt.lg" @removeRow="removeRow($event)" />
            </template>
        </q-table>
    </q-card-section>
</template>

<script>
    import { computed } from "vue";
    import { useI18n } from "vue-i18n";
    import NestedModelRow from "./NestedModelRow.vue";

    export default {
        // name: 'ComponentName',
        props: {
            modelValue: Array,
            columns: Array,
            modelName: String,
        },
        emits: ["add", "remove"],
        components: {
            NestedModelRow,
        },
        setup(props) {
            const { t } = useI18n();

            const modifiedColumns = computed(() => {
                return props.columns.map((column) => {
                    column.align = "left";
                    column.sortable = false;
                    column.required = true;
                    return column;
                });
            });
            return {
                t,
                modifiedColumns,
                removeRow(invoiceItemIndex) {
                    props.modelValue.splice(invoiceItemIndex, 1);
                },
            };
        },
    };
</script>

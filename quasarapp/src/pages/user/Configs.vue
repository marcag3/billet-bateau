<template>
    <q-card flat>
        <q-card-section class="text-h4">
            {{ t(configs.camelCaseName, 2) }}
        </q-card-section>
        <q-card-section>
            <q-table
                :disable="configs.isLoading"
                :columns="columns"
                :rows="configs.list"
                row-key="key"
                :loading="configs.isLoading"
                :pagination="{ rowsPerPage: 15 }"
                :hide-no-data="true"
                table-header-class="bg-grey-3"
                wrap-cells
                flat
            >
                <template #body="props">
                    <q-tr :props="props">
                        <q-td key="key" :props="props">
                            {{ props.row.key }}
                        </q-td>
                        <q-td key="value" :props="props">
                            {{ props.row.value }}
                            <q-popup-edit v-model="props.row.value" @hide="save(props.row)">
                                <q-input v-model="props.row.value" dense autofocus />
                            </q-popup-edit>
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </q-card-section>
    </q-card>
</template>

<script>
    import { useQuasar } from "quasar";
    import { useConfigs } from "src/store/configs";
    import { defineComponent, ref, onMounted } from "vue";
    import { useI18n } from "vue-i18n";

    export default defineComponent({
        components: {},
        setup() {
            const { t } = useI18n();
            const configs = useConfigs();
            const $q = useQuasar();

            onMounted(async () => {
                await configs.getIndex();
            });

            return {
                t,
                configs,
                columns: ref([
                    {
                        name: "key",
                        label: t("key"),
                        field: (row) => row.key,
                        align: "left",

                        required: true,
                    },
                    {
                        name: "value",
                        label: t("value_editable"),
                        field: (row) => row.value,
                        align: "left",

                        required: true,
                    },
                ]),
                save(config) {
                    configs
                        .update(config)
                        .then(() => {
                            $q.notify({
                                color: "positive",
                                icon: "cloud_done",
                                message: t("saved"),
                            });
                        })
                        .catch(() => {});
                },
            };
        },
    });
</script>

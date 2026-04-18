<template>
    <BasicModelTable :resourceStore="activities" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { useActivities } from "src/store/activities";
    import { defineComponent, ref, onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useQuasar } from "quasar";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const activities = useActivities();
            const $q = useQuasar();

            onMounted(() => {
                activities.getIndex();
            });

            return {
                t,
                activities,
                visibleColumns: computed(() => ($q.screen.gt.xs ? ["description_fr", "description_en"] : [])),
                columns: ref([
                    {
                        name: "name",
                        label: t("name"),
                        field: (row) => row.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "description_fr",
                        label: t("description_fr"),
                        field: (row) => row.description_fr,
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                    {
                        name: "description_en",
                        label: t("description_en"),
                        field: (row) => row.description_en,
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                ]),
            };
        },
    });
</script>

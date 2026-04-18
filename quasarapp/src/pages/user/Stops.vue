<template>
    <BasicModelTable :resourceStore="stops" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { useStops } from "src/store/stops";
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
            const stops = useStops();
            const $q = useQuasar();

            onMounted(() => {
                stops.getIndex();
            });

            return {
                t,
                stops,
                visibleColumns: computed(() => ($q.screen.gt.xs ? [] : [])),
                columns: ref([
                    {
                        name: "name",
                        label: t("name"),
                        field: (row) => row.displayName,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                ]),
            };
        },
    });
</script>

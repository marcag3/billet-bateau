<template>
    <BasicModelTable :resourceStore="areas" :columns="columns" />
</template>

<script>
    import { useAreas } from "src/store/areas";
    import { defineComponent, ref, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const areas = useAreas();

            onMounted(() => {
                areas.getIndex();
            });

            return {
                t,
                areas,
                columns: ref([
                    {
                        name: "name",
                        label: t("name"),
                        field: (row) => row.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                ]),
            };
        },
    });
</script>

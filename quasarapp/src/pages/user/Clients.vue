<template>
    <BasicModelTable :resourceStore="clients" :columns="columns" />
</template>

<script>
    import { useClients } from "src/store/clients";
    import { defineComponent, ref, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { formatBool } from "src/utilities/formatters";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const clients = useClients();

            onMounted(() => {
                clients.getIndex();
            });

            return {
                t,
                clients,
                columns: ref([
                    {
                        name: "id",
                        label: t("id"),
                        field: "id",
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                    {
                        name: "firstName",
                        label: t("firstName"),
                        field: "firstName",
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "name",
                        label: t("name"),
                        field: "name",
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "email",
                        label: t("email"),
                        field: "email",
                        align: "left",
                        filter: "text",

                        required: true,
                    },
                    {
                        name: "is_member",
                        label: t("is_member"),
                        field: "is_member",
                        align: "left",
                        required: false,
                        filter: "boolean",
                        format: formatBool,
                    },
                ]),
            };
        },
    });
</script>

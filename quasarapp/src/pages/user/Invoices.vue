<template>
    <invoices-table />
</template>

<script>
    import { defineComponent, onMounted } from "vue";
    import InvoicesTable from "src/components/InvoicesTable.vue";
    import { useClients } from "src/store/clients";
    import { useUsers } from "src/store/users";

    export default defineComponent({
        components: {
            InvoicesTable,
        },
        setup() {
            const clients = useClients();
            const users = useUsers();
            onMounted(() => {
                clients.getIndexDebounce();
                users.getIndexDebounce();
            });
            return {};
        },
    });
</script>

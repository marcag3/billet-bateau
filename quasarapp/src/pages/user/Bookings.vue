<template>
    <bookings-table />
</template>

<script>
    import { defineComponent } from "vue";
    import BookingsTable from "src/components/BookingsTable.vue";

    export default defineComponent({
        components: {
            BookingsTable,
        },
        setup() {
            return {};
        },
    });
</script>

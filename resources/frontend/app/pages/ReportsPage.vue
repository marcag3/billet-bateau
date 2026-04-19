<template>
    <q-page class="page-wrap">
        <div class="content-width">
            <h1 class="text-h4 q-mb-sm">Reports</h1>
            <p class="text-body1 text-grey-8 q-mb-lg">
                This page is lazy-loaded to keep initial app startup responsive.
            </p>

            <q-table
                flat
                bordered
                row-key="name"
                :rows="rows"
                :columns="columns"
                hide-bottom
            />
        </div>
    </q-page>
</template>

<script setup>
const columns = [
    { name: 'line', label: 'Line', field: 'line', align: 'left' },
    { name: 'bookings', label: 'Bookings', field: 'bookings', align: 'right' },
    { name: 'fillRate', label: 'Fill rate', field: 'fillRate', align: 'right' },
];

const rows = [
    { line: 'Morning ferry', bookings: 184, fillRate: '92%' },
    { line: 'Afternoon ferry', bookings: 166, fillRate: '83%' },
    { line: 'Evening ferry', bookings: 152, fillRate: '76%' },
];
</script>

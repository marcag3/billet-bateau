<template>
    <q-btn label="actualiser" @click="fetchData" />

    <div class="text-h6"> All invoices </div>

    <div v-if="!invoices.isLoading">
        <q-card v-for="invoice in invoices.list" :key="invoice.id">
            <q-card-section class="text-h6">
                {{ invoice.displayName }}
            </q-card-section>
            <q-card-section>
                <p>
                    {{ invoice.displayTotal }}
                </p>
            </q-card-section>
        </q-card>
    </div>
</template>

<script>
    import { useInvoices } from "src/store/invoices";
    import { useI18n } from "vue-i18n";
    import { onMounted } from "vue";
    export default {
        // name: 'PageName',
        setup() {
            const { t } = useI18n();
            const invoices = useInvoices();

            function fetchData() {
                invoices.getIndex();
            }
            onMounted(() => {
                fetchData();
            });

            return {
                t,
                fetchData,
                invoices,
            };
        },
    };
</script>

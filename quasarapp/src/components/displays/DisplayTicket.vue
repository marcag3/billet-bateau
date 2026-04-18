<template>
    <q-card class="q-mb-sm q-pa-sm row">
        <div class="col-grow">
            <span class="text-subtitle1">
                {{ ticket.product.name }}
                <br />
            </span>
            {{ ticket.product.formatDuration("duration", "minutes") }} <br />
            {{ ticket.product.boatCategory.name }} <br />
            {{ ticket.product.displayMaxPassenger }} <br />
            {{ ticket.product.is_guided }}
            {{ ticket.displayRemainingUses }}
        </div>
    </q-card>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { Ticket } from "src/store/tickets";
    export default {
        // name: 'ComponentName',
        props: {
            ticket: Ticket,
        },
        setup() {
            const { t } = useI18n();
            return {
                t,
            };
        },
    };
</script>

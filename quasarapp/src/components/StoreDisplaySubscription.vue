<template>
    <q-card>
        <q-card-section class="text-subtitle1" style="min-height: 88px">
            {{ item.name }}
        </q-card-section>
        <q-separator></q-separator>
        <q-card-section>
            <p class="q-ma-none">
                <q-icon name="fas fa-hourglass-end" style="color: rgba(0, 0, 0, 0.54)" />
                {{ item.formatDateLong("expiration_date") }}
            </p>
            <p class="q-ma-none">
                <q-icon name="fas fa-money-check-alt" style="color: rgba(0, 0, 0, 0.54)" />
                {{ item.formatMoney("price") }}
            </p>
        </q-card-section>
        <store-display-item-action
            unique
            :numberInCart="item.numberInCart"
            @add="$emit('add')"
            @remove="$emit('remove')"
        />
    </q-card>
</template>

<script>
    import StoreDisplayItemAction from "./StoreDisplayItemAction.vue";
    export default {
        components: { StoreDisplayItemAction },
        // name: 'ComponentName',
        props: {
            item: Object,
        },
        emits: ["add", "remove"],
        setup() {
            return {};
        },
    };
</script>

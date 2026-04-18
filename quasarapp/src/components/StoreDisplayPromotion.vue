<template>
    <q-card>
        <q-card-section class="text-subtitle1" style="min-height: 116px">
            {{ item.displayName }}
        </q-card-section>
        <q-separator></q-separator>
        <q-card-section>
            <p class="q-ma-none">
                <q-icon left name="fas fa-money-check-alt" style="color: rgba(0, 0, 0, 0.54)" />
                {{ item.displayValue }}
            </p>
        </q-card-section>
        <store-display-item-action :numberInCart="item.numberInCart" @add="$emit('add')" @remove="$emit('remove')" />
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

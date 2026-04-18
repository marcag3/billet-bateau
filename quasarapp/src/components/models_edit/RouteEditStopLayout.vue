<template>
    <q-tr :props="props" v-if="display == 'row'">
        <!-- arrival -->
        <q-td key="arrival" :props="props">
            <slot name="arrival"></slot>
        </q-td>
        <!-- stops select -->
        <q-td key="stop" :props="props">
            <slot name="stop"></slot>
        </q-td>
    </q-tr>
    <div v-if="display == 'card'" class="q-pa-none col-xs-12">
        <q-card>
            <q-list dense>
                <!-- arrival -->
                <q-item key="arrival" :props="props">
                    <slot name="arrival"></slot>
                </q-item>
                <!-- stops select -->
                <q-item key="stop" :props="props">
                    <slot name="stop"></slot>
                </q-item>
            </q-list>
        </q-card>
    </div>
</template>

<script>
    export default {
        // name: 'ComponentName',
        props: {
            display: String,
            props: Object,
        },
        setup() {
            return {};
        },
    };
</script>

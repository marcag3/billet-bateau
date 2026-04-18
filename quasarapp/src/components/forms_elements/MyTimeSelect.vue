<template>
    <q-input
        ref="timeSelect"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        filled
        mask="##:##"
        placeholder="HH:MM"
        @focus="$refs.timeSelect.select()"
        :error="validation ? validation.$error : false"
        bottom-slots
        :readonly="disable"
        :disable="disable"
    >
        <template v-slot:before>
            <q-icon :name="icon" />
        </template>
        <template v-slot:append>
            <q-icon name="fas fa-clock" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time
                        :model-value="modelValue"
                        @update:model-value="$emit('update:modelValue', $event)"
                        mask="HH:mm"
                        now-btn
                        minimal
                        format24h
                        :options="(hr, min, sec) => min % 5 == 0"
                    >
                        <q-btn label="OK" color="primary" flat v-close-popup />
                    </q-time>
                </q-popup-proxy>
            </q-icon>
        </template>
        <template v-slot:error>
            <template v-for="error of validation.$errors" :key="error.$uid">
                <div v-html="error.$message" class="text-negative"></div>
            </template>
        </template>
    </q-input>
</template>

<script>
    export default {
        // name: 'ComponentName',
        props: {
            modelValue: String,
            validation: Object,
            icon: String,
            disable: Boolean,
        },
        emits: ["update:modelValue"],
        setup() {
            return {};
        },
    };
</script>

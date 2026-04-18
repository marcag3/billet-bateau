<template>
    <q-input
        ref="dateTimeSelect"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        filled
        mask="####-##-## ##:##"
        placeholder="AAAA-MM-JJ HH:mm"
        @focus="$refs.dateTimeSelect.select()"
        :error="validation ? validation.$error : false"
        bottom-slots
    >
        <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date
                        :model-value="modelValue"
                        @update:model-value="$emit('update:modelValue', $event), $refs.qDateProxy.hide()"
                        mask="YYYY-MM-DD HH:mm"
                        today-btn
                    />
                </q-popup-proxy>
            </q-icon>
            <q-icon name="fas fa-clock" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time
                        :model-value="modelValue"
                        @update:model-value="$emit('update:modelValue', $event)"
                        mask="YYYY-MM-DD HH:mm"
                        now-btn
                        minimal
                        format24h
                        :options="(hr, min, sec) => min % 5 == 0"
                    >
                        <div class="row items-center justify-end">
                            <q-btn label="OK" color="primary" flat v-close-popup />
                        </div>
                    </q-time>
                </q-popup-proxy>
            </q-icon>
        </template>
        <template v-slot:before>
            <q-icon :name="icon" />
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
        },
        emits: ["update:modelValue"],
        setup() {
            return {};
        },
    };
</script>

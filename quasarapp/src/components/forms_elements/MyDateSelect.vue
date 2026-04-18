<template>
    <q-input
        ref="dateSelect"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        filled
        mask="####-##-##"
        placeholder="AAAA-MM-JJ"
        @focus="$refs.dateSelect.select()"
        :error="validation ? validation.$error : false"
        bottom-slots
    >
        <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date
                        :model-value="modelValue"
                        @update:model-value="$emit('update:modelValue', $event), $refs.qDateProxy.hide()"
                        mask="YYYY-MM-DD"
                        today-btn
                    />
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

<template>
    <q-input
        v-for="(question, index) in questions"
        :key="`${index}-${question}`"
        :model-value="answers[index] ?? ''"
        outlined
        :label="question"
        :disable="disabled"
        :error="errors[index] !== undefined"
        :error-message="errors[index] ?? ''"
        @update:model-value="(value) => onAnswerUpdate(index, value)"
    />
</template>

<script setup lang="ts">
const props = defineProps<{
    questions: string[];
    answers: string[];
    errors?: Record<number, string>;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    'update:answers': [value: string[]];
}>();

function onAnswerUpdate(index: number, value: string | number | null): void {
    const next = [...props.answers];
    while (next.length < props.questions.length) {
        next.push('');
    }
    next[index] = String(value ?? '');
    emit('update:answers', next);
}
</script>

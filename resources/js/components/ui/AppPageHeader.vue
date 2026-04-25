<template>
    <header :class="headerClass">
        <h1
            v-if="title"
            :class="titleClass"
        >
            {{ title }}
        </h1>
        <slot
            v-else
            name="title"
        />
        <p
            v-if="description"
            :class="descriptionClass"
        >
            {{ description }}
        </p>
        <p
            v-else-if="hasDefaultSlot"
            :class="descriptionClass"
        >
            <slot />
        </p>
        <div
            v-if="$slots.actions"
            :class="actionsClass"
        >
            <slot name="actions" />
        </div>
    </header>
</template>

<script setup>
import { computed, useSlots } from 'vue';

const props = defineProps({
    title: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    /** Default: list page. `hero` uses dark gradient (e.g. programs). */
    variant: {
        type: String,
        default: 'default',
        validator: (v) => v === 'default' || v === 'hero',
    },
    /** `body1` (default) or `body2` for the description line. */
    descriptionSize: {
        type: String,
        default: 'body1',
        validator: (v) => v === 'body1' || v === 'body2',
    },
});

const slots = useSlots();
const hasDefaultSlot = computed(() => Boolean(slots.default));

const headerClass = computed(() => {
    if (props.variant === 'hero') {
        return 'app-page-header app-page-header--hero q-mb-lg';
    }
    return 'app-page-header';
});

const titleClass = computed(() => {
    if (props.variant === 'hero') {
        return 'text-h4 q-mb-sm text-weight-bold';
    }
    return 'text-h4 q-mb-sm';
});

const descriptionClass = computed(() => {
    if (props.variant === 'hero') {
        return 'text-body1 q-mb-none app-page-header__hero-copy';
    }
    const size = props.descriptionSize === 'body2' ? 'text-body2' : 'text-body1';
    return `${size} text-grey-8 q-mb-lg`;
});

const actionsClass = computed(() => 'q-mt-sm');
</script>

<style scoped>
.app-page-header--hero {
    border-radius: var(--app-radius-lg);
    padding: 1.5rem;
    background: linear-gradient(
        122deg,
        rgba(0, 22, 77, 0.95) 0%,
        rgba(8, 44, 116, 0.94) 64%,
        rgba(234, 29, 44, 0.9) 100%
    );
    color: #ffffff;
    box-shadow: var(--app-hero-shadow);
}

.app-page-header__hero-copy {
    color: rgba(255, 255, 255, 0.9);
}
</style>

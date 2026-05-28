<template>
    <div class="control-panel-trip-strip row no-wrap q-gutter-md q-pb-md">
        <slot />
    </div>
</template>

<style scoped>
.control-panel-trip-strip {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    align-items: stretch;
}

.control-panel-trip-strip :deep(.control-panel-trip-card) {
    scroll-snap-align: start;
    flex: 0 0 auto;
}
</style>

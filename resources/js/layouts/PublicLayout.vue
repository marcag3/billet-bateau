<template>
    <q-layout view="Lpr lff" class="public-shell">
        <q-page-container class="public-page-container">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<style scoped>
.public-shell {
    background:
        linear-gradient(125deg, hsla(226, 97%, 12%, 0.06) 0%, rgba(255, 255, 255, 0.98) 42%),
        linear-gradient(180deg, #f8fafc 0%, #f2f4fb 100%);
}

.public-page-container :deep(.q-page) {
    width: min(76rem, 100%);
    margin: 0 auto;
}
</style>

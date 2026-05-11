<template>
    <q-layout view="hHh lpr fFf" class="public-shell">
        <q-page-container style="width: 100%;">
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

</style>

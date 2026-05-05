<template>
    <q-btn
        class="q-ml-md app-language-switcher__btn"
        flat
        round
        dense
        icon="language"
        :aria-label="t('common.language')"
        :aria-haspopup="true"
        :aria-expanded="menuOpen ? 'true' : 'false'"
    >
        <q-menu
            v-model="menuOpen"
            anchor="bottom right"
            self="top right"
            transition-show="jump-down"
            transition-hide="jump-up"
        >
            <q-list dense>
                <q-item
                    v-for="opt in langOptions"
                    :key="opt.value"
                    v-close-popup
                    clickable
                    :active="locale === opt.value"
                    @click="setLocale(opt.value)"
                >
                    <q-item-section>{{ opt.label }}</q-item-section>
                </q-item>
            </q-list>
        </q-menu>
    </q-btn>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { setLocale, type AppLocale } from "../utilities/i18n";

const { t, locale } = useI18n();

const menuOpen = ref(false);

/** Native names so each option stays recognizable regardless of the active UI locale. */
const langOptions: { label: string; value: AppLocale }[] = [
    { label: "English", value: "en" },
    { label: "Français", value: "fr" },
];
</script>

<style scoped>
.app-language-switcher__btn {
    color: rgba(255, 255, 255, 0.92);
}

</style>

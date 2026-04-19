<template>
    <q-layout view="hHh lpR fFf">
        <q-header elevated>
            <q-toolbar>
                <q-toolbar-title>{{ t('common.publicExperience') }}</q-toolbar-title>
                <q-btn color="accent" flat :label="t('common.openApp')" href="/app" />
            </q-toolbar>
        </q-header>

        <q-page-container>
            <q-page class="row items-center justify-center q-pa-xl">
                <div class="text-center">
                    <div class="text-h3 q-mb-md">{{ t('common.welcome') }}</div>
                    <p class="text-body1">
                        {{ t('public.minimalDescription') }}
                    </p>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

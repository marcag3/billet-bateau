<template>
    <q-page class="q-pa-md app-test-page">
        <AppPageHeader variant="hero" title="Test Page" description="Barebone test page." />
        <div v-for="[id, program] in programsCollection" :key="id">
            <div>{{ program.name }}</div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { createCollection } from '@tanstack/db';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { getPowerSyncDbRef } from '../powersync/app-powersync.runtime';
import { appProgramsPowerSyncTable } from '../powersync/app.powersync-schema';
const db = getPowerSyncDbRef().value;
const programsCollection = createCollection(
    powerSyncCollectionOptions({
        database: db,
        table: appProgramsPowerSyncTable
    })
)
</script>


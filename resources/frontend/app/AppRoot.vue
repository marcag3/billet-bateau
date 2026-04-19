<template>
    <q-layout view="hHh lpR fFf">
        <q-header elevated>
            <q-toolbar>
                <q-toolbar-title>Application Workspace</q-toolbar-title>

                <q-tabs shrink>
                    <q-route-tab label="Dashboard" to="/" />
                    <q-route-tab label="Reports" to="/reports" />
                    <q-route-tab label="Settings" to="/settings" />
                </q-tabs>
            </q-toolbar>
        </q-header>

        <q-page-container>
            <router-view />
        </q-page-container>
    </q-layout>
</template>

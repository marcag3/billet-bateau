<template>
    <q-page class="page-wrap">
        <div class="content-width">
            <h1 class="text-h4 q-mb-sm">Dashboard</h1>
            <p class="text-body1 text-grey-8 q-mb-lg">
                This application bundle is intentionally feature-rich and can grow independently from the public site.
            </p>

            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                    <q-card flat bordered>
                        <q-card-section>
                            <div class="text-subtitle1">Operations</div>
                            <div class="text-caption text-grey-7">Manage crossings, boats, and capacity.</div>
                        </q-card-section>
                    </q-card>
                </div>
                <div class="col-12 col-md-6">
                    <q-card flat bordered>
                        <q-card-section>
                            <div class="text-subtitle1">Analytics</div>
                            <div class="text-caption text-grey-7">Track bookings and conversion trends.</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-actions align="right">
                            <q-btn color="primary" to="/app/reports" label="Open reports" />
                        </q-card-actions>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<template>
    <q-btn-dropdown
        class="ellipsis"
        v-bind="$attrs"
        :class="{ 'q-mx-sm': top }"
        icon="fas fa-map-marker-alt"
        :label="appState.thisPointOfSale.displayName"
        flat
        stretch
        no-caps
    >
        <q-list>
            <q-item
                v-for="pointOfSale of pointsOfSaleList"
                :key="pointOfSale.id"
                clickable
                v-close-popup
                @click="selectPointOfSale(pointOfSale.id)"
            >
                <q-item-section>
                    <q-item-label>{{ pointOfSale.displayName }}</q-item-label>
                </q-item-section>
            </q-item>
        </q-list>
    </q-btn-dropdown>
    <q-dialog :model-value="appState.thisPointOfSaleId === null" persistent>
        <q-card>
            <q-card-section class="row">
                <div class="text-h6">
                    {{ appState.guard === "client" ? t("for_what_area_are_you_visiting") : t("select_point_of_sale") }}
                </div>
                <q-space />
            </q-card-section>
            <q-card-section class="row justify-around q-gutter-md">
                <q-btn
                    class="col q-pa-lg"
                    color="secondary"
                    v-for="pointOfSale of pointsOfSaleList"
                    :key="pointOfSale.id"
                    @click="selectPointOfSale(pointOfSale.id)"
                >
                    {{ pointOfSale.displayName }}
                </q-btn>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script>
    import { onMounted, computed } from "vue";
    import { usePointsOfSale } from "src/store/pointsOfSale";
    import { useI18n } from "vue-i18n";
    import { useAreas } from "src/store/areas";
    import { useAppState } from "src/store/appState";
    import config from "src/config.json";
    import { useQuasar } from "quasar";

    export default {
        props: { top: Boolean },
        // name: 'ComponentName',
        setup() {
            const { t } = useI18n();
            const pointsOfSale = usePointsOfSale();
            const areas = useAreas();
            const appState = useAppState();
            const $q = useQuasar();

            const pointsOfSaleList = computed(() =>
                pointsOfSale.filteredList({
                    isClient: {
                        path: "is_for_client",
                        value: appState.guard === "client" ? true : false,
                    },
                })
            );

            onMounted(() => {
                areas.getIndexDebounce();
                pointsOfSale.getIndexDebounce();
            });
            return {
                t,
                pointsOfSaleList,
                pointsOfSale,
                appState,
                selectPointOfSale(pointOfSaleId) {
                    appState.thisPointOfSaleId = pointOfSaleId;
                    $q.cookies.set("point_of_sale_id", pointOfSaleId, config.cookiesOptions);
                },
            };
        },
    };
</script>

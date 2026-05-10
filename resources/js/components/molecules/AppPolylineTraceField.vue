<template>
    <div class="app-polyline-trace-field">
        <div v-if="label.length > 0" class="text-body2 q-mb-xs">
            {{ label }}
        </div>
        <div
            ref="mapContainerRef"
            class="app-polyline-trace-field__map"
            :class="{ 'app-polyline-trace-field__map--disabled': disable }"
            data-testid="polyline-trace-map"
        />
        <div class="row q-gutter-sm q-mt-sm">
            <q-btn
                outline
                dense
                color="primary"
                type="button"
                :disable="disable || !canUndo"
                :label="t('waterRoutesList.traceUndo')"
                data-testid="polyline-trace-undo"
                @click="onUndo"
            />
            <q-btn
                outline
                dense
                color="negative"
                type="button"
                :disable="disable || !canClear"
                :label="t('waterRoutesList.traceClear')"
                data-testid="polyline-trace-clear"
                @click="onClear"
            />
        </div>
        <div
            v-if="error && errorMessage.length > 0"
            class="text-negative text-caption q-mt-xs"
            data-testid="polyline-trace-error"
        >
            {{ errorMessage }}
        </div>
        <div v-else-if="hint.length > 0" class="text-caption text-grey-7 q-mt-xs">
            {{ hint }}
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import type {
    LatLngExpression,
    Layer,
    LeafletMouseEvent,
    Map as LeafletMap,
} from 'leaflet';
import {
    circleMarker as leafletCircleMarker,
    latLng as leafletLatLng,
    latLngBounds as leafletLatLngBounds,
    map as createLeafletMap,
    polyline as leafletPolyline,
    tileLayer as leafletTileLayer,
} from 'leaflet';
import {
    parseLineStringGeoJson,
    stringifyLineStringGeoJson,
    type LineStringGeoJson,
} from '../../utilities/geojson-line-string';
import { useUserGeolocation } from '../../composables/useUserGeolocation';

const props = withDefaults(
    defineProps<{
        modelValue: string;
        label?: string;
        hint?: string;
        disable?: boolean;
        error?: boolean;
        errorMessage?: string;
    }>(),
    {
        label: '',
        hint: '',
        disable: false,
        error: false,
        errorMessage: '',
    },
);

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const { t } = useI18n();
const { resolveUserCoordinates } = useUserGeolocation();

const mapContainerRef = ref<HTMLElement | null>(null);
const mapRef = ref<LeafletMap | null>(null);
const routeLayersRef = ref<Layer[]>([]);

/** [lng, lat] pairs — GeoJSON order */
const coordinatesRef = ref<[number, number][]>([]);

const canUndo = computed(() => coordinatesRef.value.length > 0);
const canClear = computed(() => coordinatesRef.value.length > 0);

function removeRouteLayers(): void {
    const map = mapRef.value;
    if (!map) {
        return;
    }
    for (const layer of routeLayersRef.value) {
        map.removeLayer(layer);
    }
    routeLayersRef.value = [];
}

function lngLatPairsToLeafletLatLngs(pairs: [number, number][]): LatLngExpression[] {
    return pairs.map(([lng, lat]) => leafletLatLng(lat, lng));
}

function redrawRoute(): void {
    const map = mapRef.value;
    if (!map) {
        return;
    }
    removeRouteLayers();
    const pairs = coordinatesRef.value;
    if (pairs.length === 0) {
        return;
    }
    const latLngs = lngLatPairsToLeafletLatLngs(pairs);
    if (pairs.length === 1) {
        const cm = leafletCircleMarker(latLngs[0], {
            radius: 6,
            color: '#1976d2',
            weight: 2,
            fillColor: '#1976d2',
            fillOpacity: 0.35,
        }).addTo(map);
        routeLayersRef.value.push(cm);
        map.setView(latLngs[0], Math.max(map.getZoom(), 13));
        return;
    }
    const poly = leafletPolyline(latLngs, {
        color: '#1976d2',
        weight: 4,
    }).addTo(map);
    routeLayersRef.value.push(poly);
    map.fitBounds(leafletLatLngBounds(latLngs), { padding: [24, 24], maxZoom: 16 });
}

function emitFromCoordinates(): void {
    const pairs = coordinatesRef.value;
    if (pairs.length === 0) {
        emit('update:modelValue', '');
        return;
    }
    const geo: LineStringGeoJson = {
        type: 'LineString',
        coordinates: pairs,
    };
    emit('update:modelValue', stringifyLineStringGeoJson(geo));
}

function applyExternalModelValue(raw: string): void {
    const parsed = parseLineStringGeoJson(raw);
    if (!parsed) {
        coordinatesRef.value = [];
        redrawRoute();
        return;
    }
    coordinatesRef.value = parsed.coordinates.map(([lng, lat]) => [lng, lat]);
    redrawRoute();
}

function onMapClick(e: LeafletMouseEvent): void {
    if (props.disable) {
        return;
    }
    const { lng, lat } = e.latlng;
    coordinatesRef.value = [...coordinatesRef.value, [lng, lat]];
    redrawRoute();
    emitFromCoordinates();
}

function onUndo(): void {
    if (props.disable || coordinatesRef.value.length === 0) {
        return;
    }
    coordinatesRef.value = coordinatesRef.value.slice(0, -1);
    redrawRoute();
    emitFromCoordinates();
}

function onClear(): void {
    if (props.disable || coordinatesRef.value.length === 0) {
        return;
    }
    coordinatesRef.value = [];
    redrawRoute();
    emitFromCoordinates();
}

function setMapInteractionDisabled(disabled: boolean): void {
    const map = mapRef.value;
    if (!map) {
        return;
    }
    if (disabled) {
        map.dragging.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        map.tap?.disable();
    } else {
        map.dragging.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        map.tap?.enable();
    }
}

function initMap(): void {
    const el = mapContainerRef.value;
    if (!el) {
        return;
    }
    const fallbackCenter = leafletLatLng(45.5017, -73.5673);
    const map = createLeafletMap(el, {
        zoomControl: true,
        attributionControl: true,
    }).setView(fallbackCenter, 12);

    leafletTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    map.on('click', onMapClick);
    mapRef.value = map;
    applyExternalModelValue(props.modelValue);
    setMapInteractionDisabled(props.disable);
    void nextTick(() => {
        map.invalidateSize();
    });

    void resolveUserCoordinates().then((coords) => {
        const currentMap = mapRef.value;
        if (!currentMap || !coords) {
            return;
        }
        if (coordinatesRef.value.length > 0) {
            return;
        }
        currentMap.setView(leafletLatLng(coords.lat, coords.lng), 13);
    });
}

function destroyMap(): void {
    const map = mapRef.value;
    if (!map) {
        return;
    }
    map.off('click', onMapClick);
    removeRouteLayers();
    map.remove();
    mapRef.value = null;
}

onMounted(() => {
    initMap();
});

onBeforeUnmount(() => {
    destroyMap();
});

watch(
    () => props.modelValue,
    (next) => {
        const parsedNext = parseLineStringGeoJson(next);
        const nextPairs =
            parsedNext?.coordinates.map(([lng, lat]) => [lng, lat] as [number, number]) ?? [];
        const current = coordinatesRef.value;
        if (nextPairs.length === current.length) {
            let same = true;
            for (let i = 0; i < nextPairs.length; i++) {
                const a = nextPairs[i];
                const b = current[i];
                if (a[0] !== b[0] || a[1] !== b[1]) {
                    same = false;
                    break;
                }
            }
            if (same) {
                return;
            }
        }
        applyExternalModelValue(next);
    },
);

watch(
    () => props.disable,
    (disabled) => {
        setMapInteractionDisabled(disabled);
    },
);
</script>

<style scoped>
.app-polyline-trace-field__map {
    width: 100%;
    min-height: 280px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.12);
}

.app-polyline-trace-field__map--disabled {
    opacity: 0.65;
    pointer-events: none;
}
</style>

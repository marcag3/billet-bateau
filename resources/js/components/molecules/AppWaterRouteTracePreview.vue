<template>
    <div class="app-water-route-trace-preview relative-position rounded-borders overflow-hidden">
        <div
            ref="mapContainerRef"
            class="app-water-route-trace-preview__map"
            aria-hidden="true"
        />
        <div
            class="app-water-route-trace-preview__title absolute-top text-white q-pa-sm"
        >
            <h3 class="app-water-route-trace-preview__title-text text-h6 text-shadow-1">
                {{ displayTitle }}
            </h3>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
    computed,
} from "vue";
import type { LatLngExpression, Layer, Map as LeafletMap } from "leaflet";
import {
    divIcon as leafletDivIcon,
    latLng as leafletLatLng,
    latLngBounds as leafletLatLngBounds,
    map as createLeafletMap,
    marker as leafletMarker,
    polyline as leafletPolyline,
    tileLayer as leafletTileLayer,
} from "leaflet";
import {
    parseLineStringGeoJson,
    type LineStringGeoJson,
} from "../../utilities/geojson-line-string";

const props = withDefaults(
    defineProps<{
        /** GeoJSON LineString string from PowerSync `trace`. */
        traceGeoJson?: string | null;
        /** Route name shown over the map (program-card style). */
        title: string;
    }>(),
    {
        traceGeoJson: "",
    },
);

const mapContainerRef = ref<HTMLElement | null>(null);
const mapRef = ref<LeafletMap | null>(null);
const routeLayersRef = ref<Layer[]>([]);
const lastParsedGeoRef = ref<LineStringGeoJson | null>(null);

let mapResizeObserver: ResizeObserver | null = null;

const displayTitle = computed(() =>
    String(props.title ?? "").trim().length > 0
        ? String(props.title).trim()
        : "—",
);

const ENDPOINT_ICON_PX = 28;

function endpointDivIcon(kind: "start" | "finish"): ReturnType<
    typeof leafletDivIcon
> {
    const color = kind === "start" ? "#2e7d32" : "#000000";
    const glyph = kind === "start" ? "play_circle" : "flag";
    return leafletDivIcon({
        className: "app-water-route-trace-preview__endpoint-marker",
        html: `<span class="material-icons" style="font-size:${ENDPOINT_ICON_PX}px;color:${color};line-height:1;display:block;">${glyph}</span>`,
        iconSize: [ENDPOINT_ICON_PX, ENDPOINT_ICON_PX],
        iconAnchor: [ENDPOINT_ICON_PX / 2, ENDPOINT_ICON_PX / 2],
    });
}

function lngLatPairsToLeafletLatLngs(
    pairs: [number, number][],
): LatLngExpression[] {
    return pairs.map(([lng, lat]) => leafletLatLng(lat, lng));
}

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

function refitMapViewport(): void {
    const map = mapRef.value;
    if (!map) {
        return;
    }
    map.invalidateSize({ animate: false });
    const geo = lastParsedGeoRef.value;
    const fallbackCenter = leafletLatLng(45.5017, -73.5673);
    if (!geo || geo.coordinates.length === 0) {
        map.setView(fallbackCenter, 11, { animate: false });
        return;
    }
    const pairs = geo.coordinates.map(
        ([lng, lat]) => [lng, lat] as [number, number],
    );
    const latLngs = lngLatPairsToLeafletLatLngs(pairs);
    if (pairs.length === 1) {
        map.setView(latLngs[0], 14, { animate: false });
        return;
    }
    map.fitBounds(leafletLatLngBounds(latLngs), {
        padding: [28, 28],
        maxZoom: 15,
        animate: false,
    });
}

function drawParsed(geo: LineStringGeoJson | null): void {
    lastParsedGeoRef.value = geo;
    const map = mapRef.value;
    if (!map) {
        return;
    }
    removeRouteLayers();
    if (!geo || geo.coordinates.length === 0) {
        refitMapViewport();
        return;
    }
    const pairs = geo.coordinates.map(
        ([lng, lat]) => [lng, lat] as [number, number],
    );
    const latLngs = lngLatPairsToLeafletLatLngs(pairs);
    if (pairs.length === 1) {
        const startMarker = leafletMarker(latLngs[0], {
            icon: endpointDivIcon("start"),
            keyboard: false,
            interactive: false,
        }).addTo(map);
        routeLayersRef.value.push(startMarker);
        refitMapViewport();
        return;
    }
    const poly = leafletPolyline(latLngs, {
        color: "#1976d2",
        weight: 4,
        interactive: false,
    }).addTo(map);
    routeLayersRef.value.push(poly);
    const startMarker = leafletMarker(latLngs[0], {
        icon: endpointDivIcon("start"),
        keyboard: false,
        interactive: false,
    }).addTo(map);
    routeLayersRef.value.push(startMarker);
    const finishMarker = leafletMarker(latLngs[latLngs.length - 1], {
        icon: endpointDivIcon("finish"),
        keyboard: false,
        interactive: false,
    }).addTo(map);
    routeLayersRef.value.push(finishMarker);
    refitMapViewport();
}

function setPreviewInteractionDisabled(): void {
    const map = mapRef.value;
    if (!map) {
        return;
    }
    map.dragging.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.tap?.disable();
    map.zoomControl?.remove();
}


function initMap(): void {
    const el = mapContainerRef.value;
    if (!el) {
        return;
    }
    const map = createLeafletMap(el, {
        zoomControl: false,
        attributionControl: true,
        keyboard: false,
    }).setView(leafletLatLng(45.5017, -73.5673), 11);

    leafletTileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    mapRef.value = map;
    setPreviewInteractionDisabled();

    mapResizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
            refitMapViewport();
        });
    });
    mapResizeObserver.observe(el);

    const parsed = parseLineStringGeoJson(
        props.traceGeoJson != null ? String(props.traceGeoJson) : "",
    );

    map.whenReady(() => {
        void nextTick(() => {
            drawParsed(parsed);
            requestAnimationFrame(() => {
                refitMapViewport();
                requestAnimationFrame(() => {
                    refitMapViewport();
                });
            });
        });
    });
}

function destroyMap(): void {
    const el = mapContainerRef.value;
    if (mapResizeObserver != null && el != null) {
        mapResizeObserver.unobserve(el);
        mapResizeObserver.disconnect();
        mapResizeObserver = null;
    }
    const map = mapRef.value;
    if (!map) {
        return;
    }
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
    () => props.traceGeoJson,
    (next) => {
        const parsed = parseLineStringGeoJson(
            next != null ? String(next) : "",
        );
        void nextTick(() => {
            requestAnimationFrame(() => {
                drawParsed(parsed);
                requestAnimationFrame(() => {
                    refitMapViewport();
                });
            });
        });
    },
);
</script>

<style scoped>
.app-water-route-trace-preview {
    width: 100%;
}

.app-water-route-trace-preview__map {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    min-height: 200px;
    background: #e0e0e0;
    font-family: inherit;
}

.app-water-route-trace-preview__map :deep(.leaflet-control-container) {
    font-family: inherit;
}

.app-water-route-trace-preview__title {
    width: 100%;
    z-index: 500;
    background: rgba(0, 0, 0, 0.42);
    pointer-events: none;
}

.app-water-route-trace-preview__title-text {
    margin: 0;
}

.text-shadow-1 {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
}

:deep(.app-water-route-trace-preview__endpoint-marker) {
    background: transparent;
    border: none;
}

</style>

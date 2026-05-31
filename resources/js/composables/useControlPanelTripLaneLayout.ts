import { computed, onMounted, onUnmounted, ref } from 'vue';

/** Space for page header, day toolbar, and padding below the trip lane. */
const TRIP_LANE_CHROME_PX = 220;

const MIN_TRIP_LANE_HEIGHT_PX = 400;

const DEFAULT_VIEWPORT_HEIGHT_PX = 800;

export function useControlPanelTripLaneLayout() {
    const viewportHeightPx = ref(
        typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT_HEIGHT_PX,
    );

    function syncViewportHeight(): void {
        viewportHeightPx.value = window.innerHeight;
    }

    onMounted(() => {
        syncViewportHeight();
        window.addEventListener('resize', syncViewportHeight, { passive: true });
    });

    onUnmounted(() => {
        window.removeEventListener('resize', syncViewportHeight);
    });

    const tripLaneHeightPx = computed(() =>
        Math.max(MIN_TRIP_LANE_HEIGHT_PX, viewportHeightPx.value - TRIP_LANE_CHROME_PX),
    );

    const tripCardItemSize = computed(() =>
        Math.round(tripLaneHeightPx.value * (5 / 12)),
    );

    const tripLaneStyle = computed(() => ({
        height: `${tripLaneHeightPx.value}px`,
    }));

    return {
        tripCardItemSize,
        tripLaneStyle,
    };
}

import {
    computed,
    onUnmounted,
    ref,
    watch,
    type ComponentPublicInstance,
    type Ref,
} from 'vue';

const MIN_TRIP_LANE_HEIGHT_PX = 400;

/** Horizontal virtual-scroll item width from lane height (trip card aspect 5:12). */
export function computeTripCardItemSize(tripLaneHeightPx: number): number {
    return Math.round(Math.max(MIN_TRIP_LANE_HEIGHT_PX, tripLaneHeightPx) * (5 / 12));
}

function resolveLaneElement(instance: ComponentPublicInstance | null): HTMLElement | null {
    const root = instance?.$el;
    return root instanceof HTMLElement ? root : null;
}

export function useControlPanelTripLaneLayout(
    tripLaneRef: Ref<ComponentPublicInstance | null>,
) {
    const tripLaneHeightPx = ref(MIN_TRIP_LANE_HEIGHT_PX);
    let observer: ResizeObserver | null = null;

    function disconnectObserver(): void {
        observer?.disconnect();
        observer = null;
    }

    function syncLaneHeight(element: HTMLElement): void {
        const nextHeight = Math.max(MIN_TRIP_LANE_HEIGHT_PX, Math.round(element.clientHeight));
        if (nextHeight !== tripLaneHeightPx.value) {
            tripLaneHeightPx.value = nextHeight;
        }
    }

    watch(
        tripLaneRef,
        (instance) => {
            disconnectObserver();

            const element = resolveLaneElement(instance);
            if (element == null) {
                tripLaneHeightPx.value = MIN_TRIP_LANE_HEIGHT_PX;
                return;
            }

            syncLaneHeight(element);
            observer = new ResizeObserver(() => {
                syncLaneHeight(element);
            });
            observer.observe(element);
        },
        { immediate: true },
    );

    onUnmounted(() => {
        disconnectObserver();
    });

    const tripCardItemSize = computed(() => computeTripCardItemSize(tripLaneHeightPx.value));

    return {
        tripCardItemSize,
    };
}

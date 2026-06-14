import { computed, type ComponentPublicInstance, type Ref } from 'vue';

const INTERACTIVE_SELECTOR =
    'button, a, input, textarea, select, label, [role="button"], [contenteditable="true"]';

type TripLanePanDetails = {
    evt?: Event;
    isFirst?: boolean;
    isFinal?: boolean;
    offset?: { x?: number; y?: number };
};

function isInteractivePanTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
        return false;
    }

    return target.closest(INTERACTIVE_SELECTOR) != null;
}

export function useControlPanelTripLanePan(laneRef: Ref<ComponentPublicInstance | null>) {
    let panStartScrollLeft = 0;

    const scrollEl = computed((): HTMLElement | null => {
        const root = laneRef.value?.$el;
        return root instanceof HTMLElement ? root : null;
    });

    function onTripLanePan(details: TripLanePanDetails): void | false {
        if (details.isFinal === true) {
            return;
        }

        const el = scrollEl.value;
        if (el == null) {
            return;
        }

        if (details.isFirst === true) {
            if (isInteractivePanTarget(details.evt?.target ?? null)) {
                return false;
            }

            panStartScrollLeft = el.scrollLeft;
            return;
        }

        const offsetX = details.offset?.x ?? 0;
        el.scrollLeft = panStartScrollLeft - offsetX;
    }

    return { onTripLanePan };
}

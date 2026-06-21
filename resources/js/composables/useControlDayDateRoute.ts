import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useControlContextStore } from '../store/control-context.store';
import {
    normalizeCalendarYmd,
    todayLocalDateYmd,
} from '../utilities/control-panel-day-board';

export function useControlDayDateRoute() {
    const route = useRoute();
    const store = useControlContextStore();

    const programId = computed(() => String(route.params.programId ?? '').trim());

    watch(
        [programId, () => route.query.date],
        ([pid, routeDate]) => {
            if (pid.length === 0) {
                return;
            }
            store.ensureProgram(pid, routeDate);
        },
        { immediate: true },
    );

    const selectedDateYmd = computed({
        get(): string {
            const pid = programId.value;
            if (pid.length === 0) {
                return todayLocalDateYmd();
            }
            return store.getProgramState(pid).selectedDateYmd;
        },
        set(ymd: string): void {
            const pid = programId.value;
            if (pid.length === 0) {
                return;
            }
            const next = normalizeCalendarYmd(ymd) ?? todayLocalDateYmd();
            store.setSelectedDateYmd(pid, next);
        },
    });

    const showAllDates = computed({
        get(): boolean {
            const pid = programId.value;
            if (pid.length === 0) {
                return false;
            }
            return store.getProgramState(pid).showAllDates;
        },
        set(value: boolean): void {
            const pid = programId.value;
            if (pid.length === 0) {
                return;
            }
            store.setShowAllDates(pid, value);
        },
    });

    function goPrevDay(): void {
        store.goPrevDay(programId.value);
    }

    function goNextDay(): void {
        store.goNextDay(programId.value);
    }

    function goToday(): void {
        store.goToday(programId.value);
    }

    function shiftSelectedDay(deltaDays: number): void {
        store.shiftSelectedDay(programId.value, deltaDays);
    }

    return {
        programId,
        selectedDateYmd,
        showAllDates,
        goPrevDay,
        goNextDay,
        goToday,
        shiftSelectedDay,
    };
}

import { defineStore } from 'pinia';
import {
    addDaysToYmd,
    normalizeCalendarYmd,
    todayLocalDateYmd,
} from '../utilities/control-panel-day-board';

export type ControlContextProgramDateState = {
    selectedDateYmd: string;
    showAllDates: boolean;
};

function defaultProgramDateState(routeDate?: unknown): ControlContextProgramDateState {
    const fromRoute = normalizeCalendarYmd(routeDate);

    if (fromRoute != null) {
        return {
            selectedDateYmd: fromRoute,
            showAllDates: false,
        };
    }

    return {
        selectedDateYmd: todayLocalDateYmd(),
        showAllDates: false,
    };
}

export const useControlContextStore = defineStore('controlContext', {
    state: () => ({
        dateByProgramId: {} as Record<string, ControlContextProgramDateState>,
    }),
    actions: {
        ensureProgram(programId: string, routeDate?: unknown): ControlContextProgramDateState {
            const pid = programId.trim();
            if (pid.length === 0) {
                return defaultProgramDateState(routeDate);
            }

            const existing = this.dateByProgramId[pid];
            if (existing != null) {
                return existing;
            }

            const next = defaultProgramDateState(routeDate);
            this.dateByProgramId[pid] = next;
            return next;
        },

        getProgramState(programId: string, routeDate?: unknown): ControlContextProgramDateState {
            return this.ensureProgram(programId, routeDate);
        },

        setSelectedDateYmd(programId: string, ymd: string): void {
            const pid = programId.trim();
            if (pid.length === 0) {
                return;
            }

            const state = this.ensureProgram(pid);
            const next = normalizeCalendarYmd(ymd) ?? todayLocalDateYmd();
            state.selectedDateYmd = next;
            state.showAllDates = false;
        },

        setShowAllDates(programId: string, showAllDates: boolean): void {
            const pid = programId.trim();
            if (pid.length === 0) {
                return;
            }

            const state = this.ensureProgram(pid);
            state.showAllDates = showAllDates;
        },

        goPrevDay(programId: string): void {
            const pid = programId.trim();
            if (pid.length === 0) {
                return;
            }

            const state = this.ensureProgram(pid);
            state.showAllDates = false;
            state.selectedDateYmd = addDaysToYmd(state.selectedDateYmd, -1);
        },

        goNextDay(programId: string): void {
            const pid = programId.trim();
            if (pid.length === 0) {
                return;
            }

            const state = this.ensureProgram(pid);
            state.showAllDates = false;
            state.selectedDateYmd = addDaysToYmd(state.selectedDateYmd, 1);
        },

        goToday(programId: string): void {
            const pid = programId.trim();
            if (pid.length === 0) {
                return;
            }

            const state = this.ensureProgram(pid);
            state.selectedDateYmd = todayLocalDateYmd();
            state.showAllDates = false;
        },

        shiftSelectedDay(programId: string, deltaDays: number): void {
            if (deltaDays === 0) {
                return;
            }

            const pid = programId.trim();
            if (pid.length === 0) {
                return;
            }

            const state = this.ensureProgram(pid);
            state.showAllDates = false;
            state.selectedDateYmd = addDaysToYmd(state.selectedDateYmd, deltaDays);
        },
    },
});

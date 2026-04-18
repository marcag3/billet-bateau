import { ref, computed } from "vue";
import { parseDate } from "@quasar/quasar-ui-qcalendar";

export default function useTimeIndicator(calendar) {
    const currentTime = ref(null),
        currentDate = ref(null),
        timeStartPos = ref(0);

    const style = computed(() => {
        return {
            top: timeStartPos.value + "px",
        };
    });
    function adjustCurrentTime() {
        const now = parseDate(new Date());
        currentDate.value = now.date;
        currentTime.value = now.time;
        //TODO: cause error when changing page too quickly
        timeStartPos.value = calendar.value.timeStartPos(currentTime.value, false);
    }

    return {
        style,
        adjustCurrentTime,
        hasDate(days) {
            return currentDate.value ? days.find((day) => day.date === currentDate.value) : false;
        },
    };
}

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export const DEFAULT_PROGRAM_TIMEZONE = 'America/Toronto';

export type TimezoneOption = {
    value: string;
    label: string;
    offsetMinutes: number;
};

function listSupportedTimezones(): string[] {
    if (typeof Intl.supportedValuesOf === 'function') {
        return Intl.supportedValuesOf('timeZone');
    }

    return [DEFAULT_PROGRAM_TIMEZONE, 'America/Toronto', 'UTC'];
}

function timezoneOffsetMinutes(timeZone: string, at: Date = new Date()): number {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'shortOffset',
        });
        const parts = formatter.formatToParts(at);
        const offsetPart = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
        const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
        if (match == null) {
            return 0;
        }

        const sign = match[1] === '-' ? -1 : 1;
        const hours = Number(match[2]);
        const minutes = match[3] != null ? Number(match[3]) : 0;

        return sign * (hours * 60 + minutes);
    } catch {
        return 0;
    }
}

function friendlyTimezoneName(timeZone: string): string {
    const segment = timeZone.split('/').pop() ?? timeZone;

    return segment.replaceAll('_', ' ');
}

export function buildTimezoneOptions(at: Date = new Date()): TimezoneOption[] {
    return listSupportedTimezones()
        .map((value) => {
            const offsetMinutes = timezoneOffsetMinutes(value, at);
            const offsetLabel = new Intl.DateTimeFormat('en-US', {
                timeZone: value,
                timeZoneName: 'shortOffset',
            })
                .formatToParts(at)
                .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';

            const label = `${friendlyTimezoneName(value)} (${value}, ${offsetLabel})`;

            return { value, label, offsetMinutes };
        })
        .sort((a, b) => {
            if (a.offsetMinutes !== b.offsetMinutes) {
                return a.offsetMinutes - b.offsetMinutes;
            }

            return a.label.localeCompare(b.label);
        });
}

export function isSupportedTimezone(value: string): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return false;
    }

    return listSupportedTimezones().includes(trimmed);
}

export function useTimezoneOptions() {
    const { locale } = useI18n();

    const options = computed(() => {
        void locale.value;

        return buildTimezoneOptions();
    });

    return { options };
}

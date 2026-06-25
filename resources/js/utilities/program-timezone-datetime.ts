import { DEFAULT_PROGRAM_TIMEZONE } from '../composables/useTimezoneOptions';

export type DateTimeFormatOptions = {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    hour?: '2-digit' | 'numeric';
    minute?: '2-digit' | 'numeric';
};

export function resolveProgramTimezone(timezone: string | null | undefined): string {
    const trimmed = String(timezone ?? '').trim();

    return trimmed.length > 0 ? trimmed : DEFAULT_PROGRAM_TIMEZONE;
}

export function formatIsoInTimezone(
    iso: string,
    timezone: string,
    locale: string,
    options: DateTimeFormatOptions,
): string {
    const trimmed = String(iso).trim();
    if (trimmed.length === 0) {
        return '—';
    }

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
        return trimmed;
    }

    try {
        return new Intl.DateTimeFormat(locale, {
            ...options,
            timeZone: resolveProgramTimezone(timezone),
        }).format(date);
    } catch {
        return trimmed;
    }
}

export function toTimezoneDateYmd(isoDatetime: string, timezone: string): string | null {
    const trimmed = String(isoDatetime).trim();
    if (trimmed.length === 0) {
        return null;
    }

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: resolveProgramTimezone(timezone),
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        return formatter.format(date);
    } catch {
        return null;
    }
}

export function isoToProgramDateAndTime(
    iso: string,
    timezone: string,
): { date: string; time: string } {
    const trimmed = String(iso).trim();
    if (trimmed.length === 0) {
        return { date: '', time: '' };
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return { date: '', time: '' };
    }

    const tz = resolveProgramTimezone(timezone);

    try {
        const dateFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const timeFormatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const datePart = dateFormatter.format(parsed).replaceAll('/', '-');
        const timePart = timeFormatter.format(parsed);

        return { date: datePart, time: timePart };
    } catch {
        return { date: '', time: '' };
    }
}

function getTimeZoneOffsetMs(timeZone: string, at: Date): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset',
    });
    const offsetPart =
        formatter.formatToParts(at).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
    const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (match == null) {
        return 0;
    }

    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = match[3] != null ? Number(match[3]) : 0;

    return sign * (hours * 60 + minutes) * 60_000;
}

/**
 * Convert program-local wall clock (YYYY-MM-DD + HH:mm) to a UTC ISO string.
 */
export function programWallClockToIso(
    dateYmd: string,
    timeHm: string,
    timezone: string,
): string {
    const date = String(dateYmd).trim();
    let time = String(timeHm).trim();
    if (time.length === 5 && time[2] === ':') {
        time = `${time}:00`;
    }

    const [year, month, day] = date.split('-').map((part) => Number(part));
    const [hour, minute, second = 0] = time.split(':').map((part) => Number(part));
    const tz = resolveProgramTimezone(timezone);

    const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
    const offsetMs = getTimeZoneOffsetMs(tz, new Date(utcGuess));

    return new Date(utcGuess - offsetMs).toISOString();
}

export function formatDepartureParts(
    iso: string,
    timezone: string,
    locale: string,
): { date: string; time: string } {
    return {
        date: formatIsoInTimezone(iso, timezone, locale, { dateStyle: 'medium' }),
        time: formatIsoInTimezone(iso, timezone, locale, { timeStyle: 'short' }),
    };
}

export function formatDepartureLabel(
    iso: string,
    timezone: string,
    locale: string,
): string {
    const { date, time } = formatDepartureParts(iso, timezone, locale);

    return `${date}\n${time}`;
}

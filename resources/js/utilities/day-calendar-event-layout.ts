/**
 * Layout helpers for QCalendar day-body overlays: column assignment for
 * overlapping intervals and absolute positioning.
 */

export interface DayCalendarLayoutColumns {
    columnIndex: number;
    columnCount: number;
}

export interface DayCalendarEventPositionScope {
    timeStartPos: (time: string, clamp?: boolean) => number | false;
    timeDurationHeight: (minutes: number) => number;
}

/** Fallback height when route duration is missing or invalid (matches QCalendar interval). */
export const DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES = 30;

const DEFAULT_INSET_PX = 2;
const DEFAULT_GAP_PX = 2;

/**
 * Normalize route duration (minutes) for calendar bar height.
 * Non-finite, non-positive, or missing values use {@link DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES}.
 */
export function normalizeCalendarEventDurationMinutes(
    raw: unknown,
    fallbackMinutes: number = DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES,
): number {
    if (raw == null || raw === "") {
        return fallbackMinutes;
    }
    const n =
        typeof raw === "number" ? raw : Number(String(raw).trim());
    if (!Number.isFinite(n)) {
        return fallbackMinutes;
    }
    const truncated = Math.trunc(n);
    if (truncated < 1) {
        return fallbackMinutes;
    }
    return truncated;
}

/** Input for interval-aware column layout (day-body overlays). */
export type CalendarIntervalColumnInput = {
    date: string;
    time: string;
    durationMinutes: number;
    /**
     * Epoch ms at interval start. When set (e.g. from `Date.getTime()`), avoids
     * reparsing `date` + `time` and keeps consistency with trip departures.
     */
    startMs?: number;
};

function calendarIntervalMs(ev: CalendarIntervalColumnInput): {
    startMs: number;
    endMs: number;
} {
    const startMs =
        ev.startMs ??
        new Date(`${ev.date}T${ev.time}:00`).getTime();
    const endMs = startMs + ev.durationMinutes * 60 * 1000;
    return { startMs, endMs };
}

function intervalsOverlap(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number,
): boolean {
    return aStart < bEnd && bStart < aEnd;
}

/**
 * Assigns horizontal columns for events whose **[start, end)** intervals overlap
 * (half-open). Events in separate overlap clusters each get `columnCount`
 * sized to that cluster; non-overlapping events use full width (`columnCount`
 * 1). Preserves input order.
 *
 * Replaces same-start-only grouping: variable-duration bars need this so a long
 * trip starting at 10:00 does not cover a 10:30 trip in the same column.
 */
export function assignOverlappingIntervalColumnLayout<
    T extends CalendarIntervalColumnInput,
>(events: readonly T[]): Array<T & DayCalendarLayoutColumns> {
    if (events.length === 0) {
        return [];
    }

    type Annotated = {
        ev: T;
        startMs: number;
        endMs: number;
    };

    const annotated: Annotated[] = events.map((ev) => {
        const { startMs, endMs } = calendarIntervalMs(ev);
        return { ev, startMs, endMs };
    });

    const n = annotated.length;
    const adj: number[][] = Array.from({ length: n }, () => []);

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const a = annotated[i];
            const b = annotated[j];
            if (
                intervalsOverlap(
                    a.startMs,
                    a.endMs,
                    b.startMs,
                    b.endMs,
                )
            ) {
                adj[i].push(j);
                adj[j].push(i);
            }
        }
    }

    const visited = new Array<boolean>(n).fill(false);
    const components: number[][] = [];

    function dfs(u: number, acc: number[]): void {
        visited[u] = true;
        acc.push(u);
        for (const v of adj[u]) {
            if (!visited[v]) {
                dfs(v, acc);
            }
        }
    }

    for (let i = 0; i < n; i++) {
        if (!visited[i]) {
            const comp: number[] = [];
            dfs(i, comp);
            components.push(comp);
        }
    }

    const columnIndexByIdx = new Array<number>(n);
    const columnCountByIdx = new Array<number>(n);

    for (const comp of components) {
        const sortedByTime = [...comp].sort((ai, bi) => {
            const a = annotated[ai];
            const b = annotated[bi];
            if (a.startMs !== b.startMs) {
                return a.startMs - b.startMs;
            }
            return a.endMs - b.endMs;
        });

        const assignedColumn = new Map<number, number>();

        for (const itemIdx of sortedByTime) {
            const { startMs, endMs } = annotated[itemIdx];
            const used = new Set<number>();
            for (const otherIdx of comp) {
                if (otherIdx === itemIdx) {
                    continue;
                }
                if (
                    !intervalsOverlap(
                        startMs,
                        endMs,
                        annotated[otherIdx].startMs,
                        annotated[otherIdx].endMs,
                    )
                ) {
                    continue;
                }
                const col = assignedColumn.get(otherIdx);
                if (col !== undefined) {
                    used.add(col);
                }
            }
            let c = 0;
            while (used.has(c)) {
                c++;
            }
            assignedColumn.set(itemIdx, c);
        }

        let maxCol = 0;
        for (const itemIdx of comp) {
            maxCol = Math.max(maxCol, assignedColumn.get(itemIdx) ?? 0);
        }
        const columnCount = maxCol + 1;
        for (const itemIdx of comp) {
            columnIndexByIdx[itemIdx] = assignedColumn.get(itemIdx) ?? 0;
            columnCountByIdx[itemIdx] = columnCount;
        }
    }

    return annotated.map((row, idx) => ({
        ...row.ev,
        columnIndex: columnIndexByIdx[idx],
        columnCount: columnCountByIdx[idx],
    }));
}

/**
 * Groups by `date` + `time` (tab-separated key). Preserves input order for
 * column indices within each group.
 *
 * @template T Must include `date` (`YYYY-MM-DD`) and `time` (`HH:mm`).
 */
export function assignSameTimeColumnLayout<
    T extends { date: string; time: string },
>(events: readonly T[]): Array<T & DayCalendarLayoutColumns> {
    const countByKey = new Map<string, number>();
    for (const ev of events) {
        const key = `${ev.date}\t${ev.time}`;
        countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
    }

    const indexByKey = new Map<string, number>();
    const out: Array<T & DayCalendarLayoutColumns> = [];

    for (const ev of events) {
        const key = `${ev.date}\t${ev.time}`;
        const columnIndex = indexByKey.get(key) ?? 0;
        indexByKey.set(key, columnIndex + 1);
        const columnCount = countByKey.get(key) ?? 1;
        out.push({
            ...ev,
            columnIndex,
            columnCount,
        });
    }

    return out;
}

/**
 * Absolute positioning for an event inside `#day-body`: top from interval,
 * width split by column with small gaps, fixed height to avoid bleeding into
 * the next row.
 */
export function computeDayCalendarEventPositionStyle(
    scope: DayCalendarEventPositionScope,
    params: {
        time: string;
        columnIndex: number;
        columnCount: number;
        intervalMinutes?: number;
        insetPx?: number;
        gapPx?: number;
    },
): Record<string, string> {
    const intervalMinutes =
        params.intervalMinutes ?? DEFAULT_CALENDAR_EVENT_INTERVAL_MINUTES;
    const insetPx = params.insetPx ?? DEFAULT_INSET_PX;
    const gapPx = params.gapPx ?? DEFAULT_GAP_PX;

    const top = scope.timeStartPos(params.time, true);
    const topPx = top === false ? 0 : top;
    const slotH = scope.timeDurationHeight(intervalMinutes);
    const heightPx = Math.max(slotH, 24);

    const n = Math.max(1, params.columnCount);
    const i = Math.min(Math.max(0, params.columnIndex), n - 1);

    const fixedHorizontalPx = 2 * insetPx + (n - 1) * gapPx;

    const left = `calc(${insetPx}px + ${i} * ((100% - ${fixedHorizontalPx}px) / ${n} + ${gapPx}px))`;
    const width = `calc((100% - ${fixedHorizontalPx}px) / ${n})`;

    return {
        position: "absolute",
        left,
        width,
        top: `${topPx}px`,
        height: `${heightPx}px`,
        zIndex: "1",
        boxSizing: "border-box",
    };
}

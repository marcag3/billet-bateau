import { computed, ref } from 'vue';
import { isPendingSyncStatus, SYNC_STATUS } from './sync.status';

const OUTBOX_SYNCED_RETENTION_MS = 5 * 60 * 1000;
const OUTBOX_MAX_ENTRIES = 60;

function sortOutboxEntries(left, right) {
    return String(right.updatedAt ?? '').localeCompare(String(left.updatedAt ?? ''));
}

function normalizeOutboxEntry(partialEntry) {
    const now = new Date().toISOString();

    return {
        id: partialEntry.id,
        type: partialEntry.type ?? 'update',
        todoId: partialEntry.todoId ?? '',
        title: partialEntry.title ?? '',
        status: partialEntry.status ?? SYNC_STATUS.sending,
        error: partialEntry.error ?? '',
        createdAt: now,
        updatedAt: now,
    };
}

export function createOutboxStore() {
    const outboxEntries = ref([]);

    function pruneOutboxEntries() {
        const now = Date.now();
        const filtered = outboxEntries.value.filter((entry) => {
            if (entry.status !== SYNC_STATUS.synced) {
                return true;
            }

            const updatedAtMs = Number(new Date(entry.updatedAt).getTime());

            return Number.isFinite(updatedAtMs) && now - updatedAtMs < OUTBOX_SYNCED_RETENTION_MS;
        });

        outboxEntries.value = filtered.slice(0, OUTBOX_MAX_ENTRIES);
    }

    function upsertOutboxEntry(partialEntry) {
        if (!partialEntry || typeof partialEntry.id !== 'string' || partialEntry.id.length === 0) {
            return;
        }

        const nextEntry = normalizeOutboxEntry(partialEntry);
        const existingIndex = outboxEntries.value.findIndex((entry) => entry.id === nextEntry.id);

        if (existingIndex === -1) {
            outboxEntries.value = [nextEntry, ...outboxEntries.value].sort(sortOutboxEntries);
            pruneOutboxEntries();
            return;
        }

        const existingEntry = outboxEntries.value[existingIndex];
        outboxEntries.value[existingIndex] = {
            ...existingEntry,
            ...nextEntry,
            createdAt: existingEntry.createdAt ?? nextEntry.createdAt,
            updatedAt: new Date().toISOString(),
        };
        outboxEntries.value = [...outboxEntries.value].sort(sortOutboxEntries);
        pruneOutboxEntries();
    }

    return {
        outboxEntries,
        hasOutboxEntries: computed(() => outboxEntries.value.length > 0),
        pendingOutboxCount: computed(() => {
            return outboxEntries.value.filter((entry) => isPendingSyncStatus(entry.status)).length;
        }),
        upsertOutboxEntry,
    };
}

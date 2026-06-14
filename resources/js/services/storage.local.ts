export function readStorageArray(key, isValidItem) {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(key);

        if (raw === null) {
            return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter((item) => isValidItem(item));
    } catch {
        return [];
    }
}

export function writeStorageArray(key, items) {
    if (typeof window === 'undefined') {
        return;
    }

    if (items.length === 0) {
        window.localStorage.removeItem(key);
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(items));
}

import { PGlite } from '@electric-sql/pglite';
import { PGliteWorker } from '@electric-sql/pglite/worker';

const OPFS_DATA_DIR = 'opfs-ahp://todos-local-db';
const IDB_DATA_DIR = 'idb://todos-local-db';

let pglitePromise = null;

function isSafariBrowser() {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const userAgent = navigator.userAgent;
    return /Safari/i.test(userAgent) && !/Chrome|Chromium|Edg|Android/i.test(userAgent);
}

function supportsOpfsPersistence() {
    if (typeof window === 'undefined') {
        return false;
    }

    if (isSafariBrowser()) {
        return false;
    }

    return typeof Worker !== 'undefined' && typeof navigator?.storage?.getDirectory === 'function';
}

function canUseWorkerTransport() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
        return false;
    }

    try {
        return new URL(import.meta.url).origin === window.location.origin;
    } catch {
        return false;
    }
}

function createPgliteWorkerClient(dataDir) {
    return PGliteWorker.create(
        new Worker(new URL('../workers/pglite.worker.js', import.meta.url), {
            type: 'module',
        }),
        {
            dataDir,
            relaxedDurability: true,
        },
    );
}

function createMainThreadPgliteClient(dataDir) {
    return PGlite.create({
        dataDir,
        relaxedDurability: true,
    });
}

async function connectPglite() {
    const workerTransportAvailable = canUseWorkerTransport();

    if (workerTransportAvailable && supportsOpfsPersistence()) {
        try {
            return await createPgliteWorkerClient(OPFS_DATA_DIR);
        } catch {
            // Fall through to IndexedDB when OPFS startup fails.
        }
    }

    if (workerTransportAvailable) {
        return createPgliteWorkerClient(IDB_DATA_DIR);
    }

    return createMainThreadPgliteClient(IDB_DATA_DIR);
}

export async function getPgliteClient() {
    if (typeof window === 'undefined') {
        throw new Error('PGlite is only available in browser environments.');
    }

    if (pglitePromise === null) {
        pglitePromise = connectPglite();
    }

    return pglitePromise;
}

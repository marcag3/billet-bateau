import { computed } from 'vue';
import { addressHasAny, buildAddressInsertRow } from '../addresses/addresses.model.js';
import { defineRelations } from '../entity.relations.js';
import { defineModel } from '../model.definition.js';
import { useEntityList } from '../entity.queries.js';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getAddressesCollectionRef,
    getProgramsCollectionRef,
    getCurrentUserIdRef,
    getPowerSyncDbRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime.js';

const noopApi = {
    /**
     * @returns {Promise<Record<string, unknown>>}
     */
    async create() {
        throw new Error('[programs] HTTP create is not used; writes go through PowerSync.');
    },
    /**
     * @returns {Promise<Record<string, unknown>>}
     */
    async update() {
        throw new Error('[programs] HTTP update is not used; writes go through PowerSync.');
    },
    /**
     * @returns {Promise<Record<string, unknown>>}
     */
    async remove() {
        throw new Error('[programs] HTTP delete is not used; writes go through PowerSync.');
    },
};

export const programsModelDefinition = defineModel({
    name: 'programs',
    collectionId: 'programs',
    persistenceSchemaVersion: 4,
    pickUpdatePayload: (changes) => ({ ...changes }),
    api: noopApi,
    orderBy: [
        { key: 'updated_at', direction: 'desc' },
        { key: 'created_at', direction: 'desc' },
        { key: 'id', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

/**
 * @param {string} hex
 * @returns {string}
 */
function normalizeThemeColor(hex) {
    const trimmed = String(hex ?? '').trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
        return trimmed.slice(0, 1) + trimmed.slice(1).toUpperCase();
    }

    return '#000000';
}

export function usePrograms() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const programsCollectionRef = getProgramsCollectionRef();
    const addressesCollectionRef = getAddressesCollectionRef();
    const currentUserIdRef = getCurrentUserIdRef();

    const { data: programs } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: programsModelDefinition.name,
        collection: programsCollectionRef,
        orderBy: programsModelDefinition.orderBy ?? [],
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureProgramsReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{ name: string, description: string, themeColor: string, address?: Record<string, string> }} input
     * @returns {Promise<string>} program id
     */
    async function createProgramWithOptionalAddress(input) {
        await ensureProgramsReady();

        const programsCollection = programsCollectionRef.value;
        const addressesCollection = addressesCollectionRef.value;

        if (!programsCollection || !addressesCollection) {
            throw new Error('Program collections are not ready.');
        }

        const userId = Number.parseInt(currentUserIdRef.value, 10);
        if (!Number.isFinite(userId)) {
            throw new Error('Missing authenticated user id.');
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const themeColor = normalizeThemeColor(input.themeColor);
        const address = input.address ?? {};
        const addressId = crypto.randomUUID();
        const hasAddress = addressHasAny(address);

        if (hasAddress) {
            addressesCollection.insert(buildAddressInsertRow(addressId, address, now));
        }

        programsCollection.insert({
            id,
            user_id: userId,
            address_id: hasAddress ? addressId : null,
            name: input.name.trim(),
            description: input.description.trim().length > 0 ? input.description.trim() : null,
            theme_color: themeColor,
            created_at: now,
            updated_at: now,
        });

        void refreshOutboxSnapshot();

        const db = getPowerSyncDbRef().value;
        if (db) {
            await waitForUploadQueueDrained(db);
        }

        return id;
    }

    return {
        programs,
        ensureProgramsReady,
        createProgramWithOptionalAddress,
        refresh: bootstrapAppPowerSync,
        hasPrograms: computed(() => programs.value.length > 0),
    };
}

import { computed } from 'vue';
import { addressHasAny, buildAddressInsertRow } from '../addresses/addresses.model';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getAddressesCollectionRef,
    getProgramsCollectionRef,
    getCurrentUserIdRef,
    getPowerSyncDbRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';

export const programsModelDefinition = defineModel({
    name: 'programs',
    collectionId: 'programs',
    persistenceSchemaVersion: 5,
    pickUpdatePayload: (changes) => ({ ...changes }),
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

/**
 * @param {string} name
 * @param {string} id
 * @returns {string}
 */
function buildInitialProgramSlug(name, id) {
    const t = String(name).trim().toLowerCase();
    const kebab = t
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    if (kebab.length > 0) {
        return kebab.length > 200 ? kebab.slice(0, 200) : kebab;
    }
    const h = id.replace(/-/g, '');

    return `p-${h.slice(0, 8)}`.toLowerCase();
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

        const parsedUserId = Number.parseInt(currentUserIdRef.value, 10);
        const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;

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
            is_active: 0,
            slug: buildInitialProgramSlug(input.name, id),
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

    /**
     * @param {string} programId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     * @returns {Promise<void>}
     */
    async function patchProgramRow(programId, updateDraft) {
        await ensureProgramsReady();
        const programsCollection = programsCollectionRef.value;
        if (!programsCollection) {
            return;
        }

        programsCollection.update(programId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    return {
        programs,
        ensureProgramsReady,
        createProgramWithOptionalAddress,
        patchProgramRow,
        refresh: bootstrapAppPowerSync,
        hasPrograms: computed(() => programs.value.length > 0),
    };
}

import { computed } from 'vue';
import { ulid } from 'ulid';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getProgramsCollectionRef,
    getCurrentUserIdRef,
    getPowerSyncDbRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';
import { foldUnicodeForProgramSlug } from '../../utilities/program-slug';

/**
 * @param {object} address
 * @returns {boolean}
 */
function addressHasAny(address) {
    return ['line_1', 'line_2', 'city', 'postal_code', 'country'].some((key) => {
        const value = address[key];
        return typeof value === 'string' && value.trim().length > 0;
    });
}

export const programsModelDefinition = defineModel({
    name: 'programs',
    collectionId: 'programs',
    persistenceSchemaVersion: 8,
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
    const t = foldUnicodeForProgramSlug(name).toLowerCase();
    const kebab = t
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    if (kebab.length > 0) {
        return kebab.length > 200 ? kebab.slice(0, 200) : kebab;
    }
    const h = id.replace(/-/g, '');

    return `p-${h.slice(0, 8)}`.toLowerCase();
}

/**
 * @param {Record<string, string | undefined>} address
 * @returns {Record<string, string | null>}
 */
function normalizeAddressRowFields(address) {
    if (!addressHasAny(address)) {
        return {
            line_1: null,
            line_2: null,
            city: null,
            postal_code: null,
            country: null,
        };
    }

    return {
        line_1: typeof address.line_1 === 'string' ? address.line_1.trim() || null : null,
        line_2: typeof address.line_2 === 'string' ? address.line_2.trim() || null : null,
        city: typeof address.city === 'string' ? address.city.trim() || null : null,
        postal_code: typeof address.postal_code === 'string' ? address.postal_code.trim() || null : null,
        country: typeof address.country === 'string' ? address.country.trim() || null : null,
    };
}

export function usePrograms() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const programsCollectionRef = getProgramsCollectionRef();
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
     * @param {{ name: string, description: string, themeColor: string, isActive: boolean, address?: Record<string, string> }} input
     * @returns {Promise<string>} program id
     */
    async function createProgramWithOptionalAddress(input) {
        await ensureProgramsReady();

        const programsCollection = programsCollectionRef.value;

        if (!programsCollection) {
            throw new Error('Program collections are not ready.');
        }

        const parsedUserId = Number.parseInt(currentUserIdRef.value, 10);
        const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;

        const id = ulid();
        const now = new Date().toISOString();
        const themeColor = normalizeThemeColor(input.themeColor);
        const address = input.address ?? {};
        const addressFields = normalizeAddressRowFields(address);

        programsCollection.insert({
            id,
            user_id: userId,
            name: input.name.trim(),
            description: input.description.trim().length > 0 ? input.description.trim() : null,
            theme_color: themeColor,
            is_active: input.isActive ? 1 : 0,
            is_archived: 0,
            slug: buildInitialProgramSlug(input.name, id),
            line_1: addressFields.line_1,
            line_2: addressFields.line_2,
            city: addressFields.city,
            postal_code: addressFields.postal_code,
            country: addressFields.country,
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
     * @param {{
     *   name: string,
     *   description: string,
     *   themeColor: string,
     *   slug: string,
     *   isActive: boolean,
     *   isArchived: boolean,
     *   address: Record<string, string>,
     * }} input
     * @returns {Promise<void>}
     */
    async function updateProgramWithOptionalAddress(programId, input) {
        await ensureProgramsReady();

        const programsCollection = programsCollectionRef.value;

        if (!programsCollection) {
            throw new Error('Program collections are not ready.');
        }

        const programRow = (programs.value ?? []).find((p) => p != null && String(p.id) === programId);
        if (!programRow) {
            throw new Error('Program not found.');
        }

        const themeColor = normalizeThemeColor(input.themeColor);
        const now = new Date().toISOString();
        const address = input.address ?? {};
        const addressFields = normalizeAddressRowFields(address);

        programsCollection.update(programId, (draft) => {
            draft.name = input.name.trim();
            draft.description = input.description.trim().length > 0 ? input.description.trim() : null;
            draft.theme_color = themeColor;
            draft.slug = input.slug;
            draft.is_active = input.isActive ? 1 : 0;
            draft.is_archived = input.isArchived ? 1 : 0;
            draft.line_1 = addressFields.line_1;
            draft.line_2 = addressFields.line_2;
            draft.city = addressFields.city;
            draft.postal_code = addressFields.postal_code;
            draft.country = addressFields.country;
            draft.updated_at = now;
        });

        void refreshOutboxSnapshot();
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
        updateProgramWithOptionalAddress,
        patchProgramRow,
        refresh: bootstrapAppPowerSync,
        hasPrograms: computed(() => programs.value.length > 0),
    };
}

import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parseOptionalNonNegativeInt, zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isTripInventoryCapsObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Validates JSON object: keys are trip ids (non-empty strings), values are non-negative int or null.
 *
 * @param {unknown} parsed
 * @returns {parsed is Record<string, number | null>}
 */
function isValidCapsShape(parsed: unknown): parsed is Record<string, number | null> {
    if (!isTripInventoryCapsObject(parsed)) {
        return false;
    }
    for (const [tripId, cap] of Object.entries(parsed)) {
        if (String(tripId).trim() === '') {
            return false;
        }
        if (cap === null) {
            continue;
        }
        if (typeof cap === 'number' && Number.isFinite(cap) && cap >= 0 && Number.isInteger(cap)) {
            continue;
        }
        if (typeof cap === 'string' && /^\d+$/.test(cap)) {
            continue;
        }
        return false;
    }
    return true;
}

/**
 * @param {string} raw
 * @param {Translator} t
 * @returns {Record<string, number | null>}
 */
export function parseTripInventoryCapsJson(raw: string, t: Translator): Record<string, number | null> {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        return {};
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    } catch {
        throw new Error(t('ticketTypesList.invalidCapsJson'));
    }
    if (!isValidCapsShape(parsed)) {
        throw new Error(t('ticketTypesList.invalidCapsJson'));
    }
    const out: Record<string, number | null> = {};
    for (const [tripId, cap] of Object.entries(parsed)) {
        const id = String(tripId).trim();
        if (id === '') {
            continue;
        }
        if (cap === null) {
            out[id] = null;
        } else if (typeof cap === 'number') {
            out[id] = cap;
        } else {
            out[id] = Number.parseInt(String(cap), 10);
        }
    }
    return out;
}

function createTicketTypeFormZodSchema(t: Translator) {
    return z
        .object({
            title: zRequiredTrimmedString(t('ticketTypesList.validationTitleRequired')),
            priceCents: z.preprocess(
                (v) => parseOptionalNonNegativeInt(v),
                z.union([z.number().int().min(0), z.null()]),
            ),
            isPayWhatYouCan: z.boolean(),
            minPerPurchase: z.preprocess((v) => {
                const n = parseOptionalNonNegativeInt(v);
                return n === null ? 0 : n;
            }, z.number().int().min(0)),
            maxPerPurchase: z.preprocess(
                (v) => parseOptionalNonNegativeInt(v),
                z.union([z.number().int().min(0), z.null()]),
            ),
            tripInventoryCapsJson: z.string(),
        })
        .superRefine((data, ctx) => {
            if (data.maxPerPurchase !== null && data.maxPerPurchase < data.minPerPurchase) {
                ctx.addIssue({
                    code: 'custom',
                    message: t('ticketTypesList.validationMaxGteMin'),
                    path: ['maxPerPurchase'],
                });
            }
            const capsRaw = data.tripInventoryCapsJson.trim();
            if (capsRaw.length === 0) {
                return;
            }
            try {
                const parsed: unknown = JSON.parse(capsRaw);
                if (!isValidCapsShape(parsed)) {
                    ctx.addIssue({
                        code: 'custom',
                        message: t('ticketTypesList.invalidCapsJson'),
                        path: ['tripInventoryCapsJson'],
                    });
                }
            } catch {
                ctx.addIssue({
                    code: 'custom',
                    message: t('ticketTypesList.invalidCapsJson'),
                    path: ['tripInventoryCapsJson'],
                });
            }
        });
}

export type TicketTypeFormValues = z.infer<ReturnType<typeof createTicketTypeFormZodSchema>>;

export function createTicketTypeFormSchema(t: Translator) {
    return toTypedSchema(createTicketTypeFormZodSchema(t));
}

/**
 * @returns {TicketTypeFormValues}
 */
export function createEmptyTicketTypeFormValues(): TicketTypeFormValues {
    return {
        title: '',
        priceCents: null,
        isPayWhatYouCan: false,
        minPerPurchase: 0,
        maxPerPurchase: null,
        tripInventoryCapsJson: '',
    };
}
